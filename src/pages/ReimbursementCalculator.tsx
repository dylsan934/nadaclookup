import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Calculator, Edit2, Plus, Printer, Star, Trash2, Sparkles, ShieldCheck, Zap } from "lucide-react";
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

const GUEST_USED_KEY = "guest_calc_used_v1";

const GuestSignupCta = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
    <div className="flex items-start gap-3">
      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline"><Link to="/auth">Log in</Link></Button>
      <Button asChild size="sm"><Link to="/auth?mode=signup">Create free account</Link></Button>
    </div>
  </div>
);

const ReimbursementCalculator = () => {
  const { user, isSubscribed, isLoading } = useAuth();
  const { toast } = useToast();
  const { rules: savedRules, refresh } = useReimbursementRules();
  const [searchParams] = useSearchParams();

  const isGuest = !user;

  // Guests get all templates as in-memory rules so they can try the tool.
  const guestRules: ReimbursementRule[] = useMemo(
    () => RULE_TEMPLATES.map((t, i) => ({ ...t, id: `guest-${i}`, is_default: i === 1 } as ReimbursementRule)),
    []
  );
  const rules: ReimbursementRule[] = isGuest ? guestRules : savedRules;

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

  // Guest gating: allow one full calculation, then require signup for another drug.
  const [guestCalcUsed, setGuestCalcUsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(GUEST_USED_KEY) === "1";
  });
  const [guestGateOpen, setGuestGateOpen] = useState(false);

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
    if (isGuest && guestCalcUsed) {
      setGuestGateOpen(true);
      return;
    }
    setSearching(true);
    const res = await nadacApi.search(searchTerm, 25);
    setSearchResults(res.data ?? []);
    setSearching(false);
  };

  const handleSelectDrug = (d: DrugData) => {
    if (isGuest && guestCalcUsed && selectedDrug?.ndc !== d.ndc) {
      setGuestGateOpen(true);
      return;
    }
    setSelectedDrug(d);
    setSearchResults([]);
  };

  const handleClearDrug = () => {
    if (isGuest && guestCalcUsed) {
      setGuestGateOpen(true);
      return;
    }
    setSelectedDrug(null);
  };

  // Mark guest's free calculation as used once they have a real result.
  useEffect(() => {
    if (isGuest && result && !guestCalcUsed) {
      window.localStorage.setItem(GUEST_USED_KEY, "1");
      setGuestCalcUsed(true);
    }
  }, [isGuest, result, guestCalcUsed]);

  // Deep-link prefill: ?ndc=... or ?drug=...
  useEffect(() => {
    const ndc = searchParams.get("ndc");
    const drug = searchParams.get("drug");
    const term = ndc || drug;
    if (!term || selectedDrug) return;
    if (isGuest && guestCalcUsed) return;
    (async () => {
      setSearching(true);
      const res = await nadacApi.search(term, 5);
      const list = res.data ?? [];
      if (ndc) {
        const exact = list.find((d) => d.ndc === ndc);
        if (exact) { setSelectedDrug(exact); setSearching(false); return; }
      }
      if (list[0]) setSelectedDrug(list[0]);
      else setSearchTerm(term);
      setSearching(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);


  const handleEditRule = (rule: ReimbursementRule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const handleNewRule = () => {
    if (isGuest) {
      setGuestGateOpen(true);
      return;
    }
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
    if (isGuest) { setGuestGateOpen(true); return; }
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
    if (isGuest) { setGuestGateOpen(true); return; }
    if (!isSubscribed && rules.length >= 1) {
      setUpgradeReason("Free accounts can save 1 reimbursement rule. Upgrade to Pro to save unlimited contract rules.");
      setUpgradeOpen(true);
      return;
    }
    setEditingRule({ ...tpl, id: "", is_default: false } as ReimbursementRule);
    setRuleModalOpen(true);
  };


  const handlePrint = () => {
    if (isGuest) { setGuestGateOpen(true); return; }
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
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              <Calculator className="h-3.5 w-3.5" /> Pharmacy Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Pharmacy Reimbursement Calculator</h1>
            <p className="text-muted-foreground mt-3 max-w-3xl text-base">
              Estimate reimbursement and margin using real NADAC ingredient cost, your contract formulas, dispensing fees, and optional paid-claim amounts. Built for independent pharmacies.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { icon: Zap, title: "1. Pick a drug", desc: "Search by name or NDC. NADAC unit price loads automatically." },
              { icon: Calculator, title: "2. Apply a rule", desc: "Use your PBM, Medicaid, LTC, or cash formula — or start from a template." },
              { icon: ShieldCheck, title: "3. See your margin", desc: "Estimated reimbursement, gross margin, and underwater alerts in real time." },
            ].map((s) => (
              <div key={s.title} className="rounded-lg border bg-card p-4">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                <div className="font-medium text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>

          {isGuest && (
            <div className="mb-6">
              <GuestSignupCta
                title={guestCalcUsed ? "You've used your free calculation — create an account to keep going" : "Try one calculation free — no signup required"}
                description={guestCalcUsed ? "Create a free account to run unlimited calculations, save your own contract rules, and track every estimate." : "You can run one full reimbursement estimate as a guest. Sign up free to save rules and run unlimited calculations."}
              />
            </div>
          )}

          {user && !isSubscribed && (
            <div className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Unlock unlimited rules, saved calculations, and CSV export</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Free plan saves 1 rule. Pro saves unlimited rules, full calculation history, and printable reports.</div>
                </div>
              </div>
              <Button asChild>
                <Link to="/pricing">Upgrade to Pro</Link>
              </Button>
            </div>
          )}

          {(
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
                            onClick={() => handleSelectDrug(d)}
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
                          <Button variant="ghost" size="sm" onClick={handleClearDrug}>Change</Button>
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

              {/* Saved rules (logged-in users only) */}
              {!isGuest ? (
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
              ) : (
                <div className="lg:col-span-5">
                  <GuestSignupCta
                    title="Save your own contract rules"
                    description="Create a free account to build PBM, Medicaid, LTC, and cash rules — and run unlimited calculations."
                  />
                </div>
              )}
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

      <Dialog open={guestGateOpen} onOpenChange={setGuestGateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a free account to keep going</DialogTitle>
            <DialogDescription>
              You've used your free guest calculation. Sign up free to run unlimited calculations, save your own contract rules, and track every estimate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button asChild variant="outline"><Link to="/auth">Log in</Link></Button>
            <Button asChild><Link to="/auth?mode=signup">Create free account</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
