import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertCircle, Calculator, Edit2, Plus, Printer, Save, Star, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { nadacApi } from "@/lib/nadac-api";
import { DrugData } from "@/components/DrugCard";
import { useReimbursementRules } from "@/hooks/useReimbursementRules";
import { RuleEditorModal } from "@/components/reimbursement/RuleEditorModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { calculate, formatCurrency, formatFormula, formatUnitPrice, RULE_TEMPLATES, type ReimbursementRule } from "@/lib/reimbursement";
import { useToast } from "@/hooks/use-toast";

const LockedAccess = () => (
  <Card className="max-w-xl mx-auto mt-12">
    <CardHeader className="text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <Calculator className="h-6 w-6 text-primary" />
      </div>
      <CardTitle>Pharmacy Reimbursement Calculator</CardTitle>
      <CardDescription>
        Create a free account or log in to use the Pharmacy Reimbursement Calculator.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button asChild><Link to="/auth">Log In</Link></Button>
      <Button asChild variant="outline"><Link to="/auth?mode=signup">Create Free Account</Link></Button>
    </CardContent>
  </Card>
);

const ReimbursementCalculator = () => {
  const { user, isSubscribed, isLoading } = useAuth();
  const { toast } = useToast();
  const { rules, refresh } = useReimbursementRules();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<DrugData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugData | null>(null);

  // Inputs
  const [quantity, setQuantity] = useState<string>("30");
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [actualReimb, setActualReimb] = useState<string>("");
  const [manualCost, setManualCost] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Modals
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReimbursementRule | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>("");

  const selectedRule = useMemo(
    () => rules.find((r) => r.id === selectedRuleId) ?? rules.find((r) => r.is_default) ?? rules[0] ?? null,
    [rules, selectedRuleId]
  );

  const result = useMemo(() => {
    if (!selectedDrug || !selectedRule) return null;
    const qty = parseFloat(quantity);
    if (!qty || qty < 0) return null;
    return calculate({
      unitPrice: selectedDrug.nadacPerUnit,
      quantity: qty,
      manualIngredientCost: manualCost ? parseFloat(manualCost) : null,
      actualReimbursement: actualReimb ? parseFloat(actualReimb) : null,
      rule: selectedRule,
    });
  }, [selectedDrug, selectedRule, quantity, manualCost, actualReimb]);

  const stale = useMemo(() => {
    if (!selectedDrug?.effectiveDate) return false;
    const days = (Date.now() - new Date(selectedDrug.effectiveDate).getTime()) / 86400000;
    return days > 60;
  }, [selectedDrug]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    const res = await nadacApi.search(searchTerm, 25);
    setSearchResults(res.data ?? []);
    setSearching(false);
  };

  const handleEditRule = (rule: ReimbursementRule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const handleNewRule = () => {
    if (!isSubscribed && rules.length >= 1) {
      setUpgradeReason("Free accounts can save 1 reimbursement rule. Upgrade to Pro to save unlimited contract rules for different PBMs, Medicaid plans, LTC contracts, and cash pricing formulas.");
      setUpgradeOpen(true);
      return;
    }
    setEditingRule(null);
    setRuleModalOpen(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this contract rule?")) return;
    const { error } = await supabase.from("reimbursement_rules").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Rule deleted" }); refresh(); }
  };

  const handleSetDefault = async (id: string) => {
    if (!isSubscribed) {
      setUpgradeReason("Setting a default contract rule is a Pro feature.");
      setUpgradeOpen(true);
      return;
    }
    if (!user) return;
    await supabase.from("reimbursement_rules").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("reimbursement_rules").update({ is_default: true }).eq("id", id);
    refresh();
  };

  const handleUseTemplate = (tpl: typeof RULE_TEMPLATES[number]) => {
    if (!isSubscribed && rules.length >= 1) {
      setUpgradeReason("Free accounts can save 1 reimbursement rule. Upgrade to Pro to save unlimited contract rules.");
      setUpgradeOpen(true);
      return;
    }
    setEditingRule({ ...tpl, id: "", is_default: false } as ReimbursementRule);
    setRuleModalOpen(true);
  };

  const handleSaveCalc = async () => {
    if (!isSubscribed) {
      setUpgradeReason("Saving calculation history is a Pro feature. Upgrade to keep a record of every reimbursement check.");
      setUpgradeOpen(true);
      return;
    }
    if (!user || !selectedDrug || !selectedRule || !result) return;
    const { error } = await supabase.from("reimbursement_calculations").insert({
      user_id: user.id,
      drug_name: selectedDrug.drugName,
      ndc: selectedDrug.ndc,
      nadac_unit_price: selectedDrug.nadacPerUnit,
      nadac_effective_date: selectedDrug.effectiveDate,
      quantity: parseFloat(quantity),
      ingredient_cost: result.ingredientCost,
      rule_id: selectedRule.id,
      rule_name_snapshot: selectedRule.name,
      estimated_reimbursement: result.estimatedReimbursement,
      actual_reimbursement: actualReimb ? parseFloat(actualReimb) : null,
      difference: result.difference,
      gross_margin: result.grossMargin,
      margin_percentage: result.marginPercentage,
      notes: notes || null,
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Calculation saved to history" });
  };

  const handlePrint = () => {
    if (!isSubscribed) {
      setUpgradeReason("Exporting and printing calculations is a Pro feature.");
      setUpgradeOpen(true);
      return;
    }
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><SiteNavigation />
        <div className="container py-12 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Pharmacy Reimbursement Calculator — NADAC Lookup</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content="Estimate pharmacy reimbursement using NADAC ingredient cost, contract formulas, and dispensing fees." />
      </Helmet>
      <Header />
      <SiteNavigation />

      <main className="flex-1 container py-6 md:py-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Pharmacy Reimbursement Calculator</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Estimate reimbursement using NADAC ingredient cost, contract formulas, dispensing fees, and optional actual paid claim amounts.
            </p>
          </header>

          {!user ? (
            <LockedAccess />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* LEFT: Calculator */}
              <div className="lg:col-span-3 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">1. Find a drug</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Drug name or NDC"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={searching}>
                        {searching ? "…" : "Search"}
                      </Button>
                    </div>
                    {searchResults.length > 0 && !selectedDrug && (
                      <div className="border rounded-lg max-h-72 overflow-y-auto divide-y">
                        {searchResults.map((d) => (
                          <button
                            key={d.ndc}
                            onClick={() => { setSelectedDrug(d); setSearchResults([]); }}
                            className="w-full text-left p-3 hover:bg-accent/50 transition-colors"
                          >
                            <div className="font-medium text-sm">{d.drugName}</div>
                            <div className="text-xs text-muted-foreground flex justify-between mt-1">
                              <span>NDC {d.ndc}</span>
                              <span>{formatUnitPrice(d.nadacPerUnit)} / {d.pricingUnit}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedDrug && (
                      <div className="border rounded-lg p-4 bg-accent/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{selectedDrug.drugName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              NDC {selectedDrug.ndc} · NADAC {formatUnitPrice(selectedDrug.nadacPerUnit)} / {selectedDrug.pricingUnit}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Effective {selectedDrug.effectiveDate}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedDrug(null)}>Change</Button>
                        </div>
                        {stale && (
                          <Alert className="mt-3 border-yellow-500/40 bg-yellow-500/10">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              This NADAC entry is more than 60 days old. CMS may have published newer pricing.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Quantity & contract rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Quantity dispensed</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Ingredient cost (auto)</Label>
                        <Input
                          readOnly
                          value={result ? formatCurrency(result.ingredientCost) : "—"}
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    {selectedRule?.cost_basis === "manual" && (
                      <div>
                        <Label>Manual ingredient cost ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={manualCost}
                          onChange={(e) => setManualCost(e.target.value)}
                          placeholder="Your acquisition cost"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Contract rule</Label>
                      <div className="flex gap-2">
                        <Select value={selectedRule?.id ?? ""} onValueChange={setSelectedRuleId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a saved rule…" />
                          </SelectTrigger>
                          <SelectContent>
                            {rules.length === 0 && <div className="p-2 text-sm text-muted-foreground">No rules saved yet</div>}
                            {rules.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}{r.is_default ? " ★" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={handleNewRule} aria-label="New rule"><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>

                    <div>
                      <Label>Actual reimbursement received (optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={actualReimb}
                        onChange={(e) => setActualReimb(e.target.value)}
                        placeholder="From paid claim"
                      />
                    </div>

                    <div>
                      <Label>Notes (optional)</Label>
                      <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT: Results */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedDrug || !selectedRule || !result ? (
                      <p className="text-sm text-muted-foreground">Search for a drug and pick a contract rule to see the estimate.</p>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <Row label="Drug" value={selectedDrug.drugName} />
                        <Row label="NDC" value={selectedDrug.ndc} />
                        <Row label="NADAC unit price" value={formatUnitPrice(selectedDrug.nadacPerUnit)} />
                        <Row label="Quantity" value={quantity} />
                        <Row label="Ingredient cost" value={formatCurrency(result.ingredientCost)} />
                        <Row label="Contract" value={selectedRule.name} />
                        <Row label="Formula" value={formatFormula(selectedRule)} />
                        {(result.appliedFloor || result.appliedCap) && (
                          <div className="text-xs text-muted-foreground italic">
                            {result.appliedFloor && "Minimum reimbursement applied. "}
                            {result.appliedCap && "Maximum cap applied."}
                          </div>
                        )}
                        <div className="border-t pt-3 mt-3">
                          <div className="text-xs text-muted-foreground">Estimated reimbursement</div>
                          <div className="text-2xl font-semibold">{formatCurrency(result.estimatedReimbursement)}</div>
                        </div>
                        {result.difference != null && (
                          <>
                            <Row label="Actual reimbursement" value={formatCurrency(parseFloat(actualReimb))} />
                            <Row label="Difference (actual − est.)" value={formatCurrency(result.difference)} />
                            {result.grossMargin != null && (
                              <Row
                                label="Estimated gross margin"
                                value={`${formatCurrency(result.grossMargin)}${result.marginPercentage != null ? ` (${result.marginPercentage.toFixed(1)}%)` : ""}`}
                                tone={marginTone(result.grossMargin, result.marginPercentage)}
                              />
                            )}
                          </>
                        )}

                        {result.estimatedReimbursement < result.ingredientCost && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">Estimated reimbursement is below ingredient cost.</AlertDescription>
                          </Alert>
                        )}
                        {result.grossMargin != null && result.grossMargin < 0 && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">Actual reimbursement is below ingredient cost.</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2 pt-3">
                          <Button onClick={handleSaveCalc} className="flex-1" variant="outline" size="sm">
                            <Save className="h-4 w-4" /> Save
                          </Button>
                          <Button onClick={handlePrint} variant="outline" size="sm">
                            <Printer className="h-4 w-4" /> Print
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-xs text-muted-foreground space-y-2">
                    <p>NADAC ingredient cost = NADAC unit price × quantity dispensed.</p>
                    <p>Contract rules are estimates and may not reflect all payer-specific terms, fees, taxes, GER, BER, DIR, MAC pricing, or reconciliation adjustments.</p>
                    <p>For informational purposes only. Not legal, financial, or contract advice.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Saved rules */}
              <div className="lg:col-span-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Saved contract rules</CardTitle>
                      <CardDescription>
                        {isSubscribed ? "Unlimited rules on Pro." : `Free plan: ${rules.length}/1 rule saved.`}
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleNewRule}><Plus className="h-4 w-4" /> New rule</Button>
                  </CardHeader>
                  <CardContent>
                    {rules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rules yet — create one or start from a template below.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Formula</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rules.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">
                                {r.name}
                                {r.is_default && <Badge variant="secondary" className="ml-2">Default</Badge>}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatFormula(r)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleSetDefault(r.id)} aria-label="Set default"><Star className={`h-4 w-4 ${r.is_default ? "fill-current" : ""}`} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditRule(r)} aria-label="Edit"><Edit2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2">Rule templates</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {RULE_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.name}
                            onClick={() => handleUseTemplate(tpl)}
                            className="text-left p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="text-sm font-medium">{tpl.name}</div>
                            <div className="text-xs text-muted-foreground">{formatFormula(tpl)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <RuleEditorModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        initial={editingRule}
        onSaved={refresh}
        existingRulesCount={rules.length}
        onUpgradeRequired={() => {
          setUpgradeReason("Free accounts can save 1 reimbursement rule. Upgrade to Pro to save unlimited contract rules for different PBMs, Medicaid plans, LTC contracts, and cash pricing formulas.");
          setUpgradeOpen(true);
        }}
      />
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} featureHighlight={upgradeReason} />
    </div>
  );
};

const Row = ({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={
        tone === "good" ? "font-medium text-[hsl(var(--success))]" :
        tone === "warn" ? "font-medium text-yellow-600 dark:text-yellow-400" :
        tone === "bad" ? "font-medium text-destructive" :
        "font-medium"
      }
    >
      {value}
    </span>
  </div>
);

function marginTone(margin: number, pct: number | null): "good" | "warn" | "bad" {
  if (margin < 0) return "bad";
  if (pct != null && pct < 5) return "warn";
  return "good";
}

export default ReimbursementCalculator;
