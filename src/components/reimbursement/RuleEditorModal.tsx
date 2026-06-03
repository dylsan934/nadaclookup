import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { multiplierFromPercent, type ReimbursementRule, type AdjustmentType, type CostBasis } from "@/lib/reimbursement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ReimbursementRule | null;
  onSaved: () => void;
  existingRulesCount: number;
  onUpgradeRequired: () => void;
}

const emptyRule = {
  name: "",
  cost_basis: "nadac" as CostBasis,
  adjustment_type: "none" as AdjustmentType,
  percentage_value: 0,
  dispensing_fee: 0,
  flat_adjustment: 0,
  minimum_reimbursement: null as number | null,
  maximum_reimbursement: null as number | null,
  notes: "",
  is_default: false,
};

export const RuleEditorModal = ({ open, onOpenChange, initial, onSaved, existingRulesCount, onUpgradeRequired }: Props) => {
  const { user, isSubscribed } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyRule);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          cost_basis: initial.cost_basis,
          adjustment_type: initial.adjustment_type,
          percentage_value: initial.percentage_value,
          dispensing_fee: initial.dispensing_fee,
          flat_adjustment: initial.flat_adjustment,
          minimum_reimbursement: initial.minimum_reimbursement,
          maximum_reimbursement: initial.maximum_reimbursement,
          notes: initial.notes ?? "",
          is_default: initial.is_default,
        });
        setAdvancedOpen(
          !!(initial.minimum_reimbursement || initial.maximum_reimbursement || initial.flat_adjustment || initial.notes || initial.is_default)
        );
      } else {
        setForm(emptyRule);
        setAdvancedOpen(false);
      }
    }
  }, [open, initial]);

  const multiplier = multiplierFromPercent(form.adjustment_type, form.percentage_value || 0);

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Give this contract rule a name.", variant: "destructive" });
      return;
    }
    if (form.percentage_value < 0 || form.percentage_value > 1000) {
      toast({ title: "Invalid percentage", variant: "destructive" });
      return;
    }
    if (form.dispensing_fee < 0) {
      toast({ title: "Dispensing fee cannot be negative", variant: "destructive" });
      return;
    }
    if (
      form.minimum_reimbursement != null &&
      form.maximum_reimbursement != null &&
      form.minimum_reimbursement > form.maximum_reimbursement
    ) {
      toast({ title: "Minimum cannot exceed maximum", variant: "destructive" });
      return;
    }

    // Free plan gate: max 1 rule on create
    if (!isSubscribed && !initial && existingRulesCount >= 1) {
      onOpenChange(false);
      onUpgradeRequired();
      return;
    }

    setSaving(true);
    try {
      // If setting as default, clear other defaults first
      if (form.is_default) {
        await supabase.from("reimbursement_rules").update({ is_default: false }).eq("user_id", user.id);
      }

      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        cost_basis: form.cost_basis,
        adjustment_type: form.adjustment_type,
        percentage_value: form.percentage_value || 0,
        multiplier,
        dispensing_fee: form.dispensing_fee || 0,
        flat_adjustment: form.flat_adjustment || 0,
        minimum_reimbursement: form.minimum_reimbursement,
        maximum_reimbursement: form.maximum_reimbursement,
        notes: form.notes?.trim() || null,
        is_default: form.is_default,
      };

      const { error } = initial && initial.id
        ? await supabase.from("reimbursement_rules").update(payload).eq("id", initial.id)
        : await supabase.from("reimbursement_rules").insert(payload);

      if (error) throw error;

      toast({ title: initial ? "Rule updated" : "Rule saved" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const proLockedField = (label: string) =>
    !isSubscribed ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-2">
        <Lock className="h-3 w-3" /> Pro
      </span>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit contract rule" : "New contract rule"}</DialogTitle>
          <DialogDescription>Build a reimbursement formula without typing equations.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Rule name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. PBM Contract A, Medicaid, LTC"
              maxLength={100}
            />
          </div>

          <div>
            <Label>Cost basis</Label>
            <Select value={form.cost_basis} onValueChange={(v: CostBasis) => setForm({ ...form, cost_basis: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nadac">NADAC</SelectItem>
                <SelectItem value="nadac_adjusted">NADAC (manually adjusted at calc time)</SelectItem>
                <SelectItem value="manual">Manual ingredient cost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Adjustment</Label>
              <Select value={form.adjustment_type} onValueChange={(v: AdjustmentType) => setForm({ ...form, adjustment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No %</SelectItem>
                  <SelectItem value="plus_pct">Plus %</SelectItem>
                  <SelectItem value="minus_pct">Minus %</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Percentage</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                disabled={form.adjustment_type === "none"}
                value={form.percentage_value}
                onChange={(e) => setForm({ ...form, percentage_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          {form.adjustment_type !== "none" && (
            <p className="text-xs text-muted-foreground">Multiplier: {multiplier.toFixed(4)}</p>
          )}

          <div>
            <Label>Dispensing fee ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.dispensing_fee}
              onChange={(e) => setForm({ ...form, dispensing_fee: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Advanced contract settings
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <div>
                <Label>Flat adjustment ($) {proLockedField("flat")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={!isSubscribed}
                  value={form.flat_adjustment}
                  onChange={(e) => setForm({ ...form, flat_adjustment: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Minimum reimb. ($) {proLockedField("min")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!isSubscribed}
                    value={form.minimum_reimbursement ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, minimum_reimbursement: e.target.value === "" ? null : parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Maximum reimb. ($) {proLockedField("max")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!isSubscribed}
                    value={form.maximum_reimbursement ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, maximum_reimbursement: e.target.value === "" ? null : parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  maxLength={500}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="default-toggle" className="flex items-center gap-2">
                  Set as default rule {proLockedField("default")}
                </Label>
                <Switch
                  id="default-toggle"
                  disabled={!isSubscribed}
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save rule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
