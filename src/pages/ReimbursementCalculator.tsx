import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "@/lib/router-compat";
import { AlertCircle, Calculator, Edit2, Loader2, Plus, Printer, Star, Trash2, Sparkles, ShieldCheck, Zap } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { nadacApi } from "@/lib/nadac-api";
import { DrugData } from "@/components/DrugCard";
import { useReimbursementRules } from "@/hooks/useReimbursementRules";
import { RuleEditorModal } from "@/components/reimbursement/RuleEditorModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { parseNdcParam, parseQtyParam } from "@/lib/drug-params";
import { calculate, DEFAULT_RULE, formatCurrency, formatFormula, formatUnitPrice, RULE_TEMPLATES, type ReimbursementRule } from "@/lib/reimbursement";
import { useToast } from "@/hooks/use-toast";
import { formatSourceDateShort } from "@/lib/format-date";

const GUEST_USED_KEY = "guest_calc_used_v1";
const FREE_MONTHLY_LIMIT = 5;

// Send users back to the calculator (with the drug and quantity they chose) after auth.
const authLink = (mode: "login" | "signup", returnTo?: string) => {
  const params = new URLSearchParams();
  if (mode === "signup") params.set("mode", "signup");
  if (returnTo) params.set("redirect", returnTo);
  const qs = params.toString();
  return qs ? `/auth?${qs}` : "/auth";
};

const GuestSignupCta = ({ title, description, returnTo }: { title: string; description: string; returnTo?: string }) => (
  <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
    <div className="flex items-start gap-3">
      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline"><Link to={authLink("login", returnTo)}>Log in</Link></Button>
      <Button asChild size="sm"><Link to={authLink("signup", returnTo)}>Create free account</Link></Button>
    </div>
  </div>
);

const ReimbursementCalculator = () => {
  const { user, isSubscribed, isLoading } = useAuth();
  const { toast } = useToast();
  const { rules: savedRules, refresh } = useReimbursementRules();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const isGuest = !user;

  // Guests get all templates as in-memory rules so they can try the tool.
  const guestRules: ReimbursementRule[] = useMemo(
    () => RULE_TEMPLATES.map((t, i) => ({ ...t, id: `guest-${i}`, is_default: i === 0 } as ReimbursementRule)),
    []
  );
  // Everyone starts on NADAC + $10.00 dispensing fee until they pick or save their own.
  const rules: ReimbursementRule[] = isGuest
    ? guestRules
    : savedRules.length > 0
      ? savedRules
      : [DEFAULT_RULE];

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<DrugData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);

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

  // Free plan gating: 5 calculations per calendar month. Pro is unlimited.
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  // Deep-link prefill state
  const [prefilling, setPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const prefillKeyRef = useRef<string | null>(null);
  const freeLimitReached = !!user && !isSubscribed && monthlyUsage >= FREE_MONTHLY_LIMIT;

  useEffect(() => {
    if (!user || isSubscribed) return;
    const month = new Date();
    const monthStart = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
    supabase
      .from("calculation_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", monthStart)
      .maybeSingle()
      .then(({ data }) => setMonthlyUsage(data?.count ?? 0));
  }, [user, isSubscribed]);

  const selectedRule = useMemo(
    () => rules.find((r) => r.id === selectedRuleId) ?? rules.find((r) => r.is_default) ?? rules[0] ?? DEFAULT_RULE,
    [rules, selectedRuleId]
  );


  // A calculation only exists after an explicit click on "Calculate reimbursement".
  // Prefilling or editing inputs never produces a result or consumes an allowance.
  const [submittedCalc, setSubmittedCalc] = useState<{
    drug: DrugData;
    rule: ReimbursementRule;
    qty: number;
    manualCost: number | null;
    actualReimb: number | null;
  } | null>(null);

  const result = useMemo(() => {
    if (!submittedCalc) return null;
    return calculate({
      unitPrice: submittedCalc.drug.nadacPerUnit,
      quantity: submittedCalc.qty,
      manualIngredientCost: submittedCalc.manualCost,
      actualReimbursement: submittedCalc.actualReimb,
      rule: submittedCalc.rule,
    });
  }, [submittedCalc]);

  // Live ingredient-cost preview (price × quantity). Display only — not a calculation.
  const ingredientCostPreview = useMemo(() => {
    if (!selectedDrug) return null;
    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return selectedDrug.nadacPerUnit * qty;
  }, [selectedDrug, quantity]);

  // Submitting a valid calculation consumes the allowance exactly once per click.
  const handleCalculate = () => {
    if (!selectedDrug || !selectedRule) return;
    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({ title: "Enter a quantity", description: "Quantity dispensed must be a positive number.", variant: "destructive" });
      return;
    }
    if (isGuest && guestCalcUsed) {
      setGuestGateOpen(true);
      return;
    }
    if (freeLimitReached) {
      setUpgradeReason(`You've used all ${FREE_MONTHLY_LIMIT} free calculations this month. Upgrade to Pro for unlimited calculations, unlimited contract rules, and full history.`);
      setUpgradeOpen(true);
      return;
    }
    setSubmittedCalc({
      drug: selectedDrug,
      rule: selectedRule,
      qty,
      manualCost: manualCost ? parseFloat(manualCost) : null,
      actualReimb: actualReimb ? parseFloat(actualReimb) : null,
    });
    if (isGuest) {
      window.localStorage.setItem(GUEST_USED_KEY, "1");
      setGuestCalcUsed(true);
    } else if (user && !isSubscribed) {
      supabase.rpc("increment_calc_usage").then(({ data, error }) => {
        if (!error && typeof data === "number") setMonthlyUsage(data);
        else setMonthlyUsage((c) => c + 1);
      });
    }
  };

  // NADAC prices carry forward: CMS only republishes a rate when it changes, so an older
  // effective date does not mean the price is out of date. We show the effective date as
  // neutral context instead of flagging it as stale.

  // Debounced predictive suggestions
  useEffect(() => {
    if (selectedDrug) { setSuggestions([]); setShowSuggestions(false); return; }
    const term = searchTerm.trim();
    if (term.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await nadacApi.getSuggestions(term, 8);
        setSuggestions(res);
        setShowSuggestions(res.length > 0);
        setSuggestionIndex(-1);
      } catch { /* ignore */ }
    }, 150);
    return () => clearTimeout(t);
  }, [searchTerm, selectedDrug]);

  const runSearch = async (termOverride?: string) => {
    const term = (termOverride ?? searchTerm).trim();
    if (!term) return;
    if (isGuest && guestCalcUsed) {
      setGuestGateOpen(true);
      return;
    }
    if (freeLimitReached) {
      setUpgradeReason(`You've used all ${FREE_MONTHLY_LIMIT} free calculations this month. Upgrade to Pro for unlimited calculations, unlimited contract rules, and full history.`);
      setUpgradeOpen(true);
      return;
    }
    setShowSuggestions(false);
    setSearching(true);
    const res = await nadacApi.search(term, 25);
    setSearchResults(res.data ?? []);
    setSearching(false);
  };

  const handleSearch = () => runSearch();

  const handleSelectSuggestion = (s: string) => {
    setSearchTerm(s);
    setShowSuggestions(false);
    setSuggestions([]);
    runSearch(s);
  };


  const handleSelectDrug = (d: DrugData) => {
    setSelectedDrug(d);
    setSearchResults([]);
    setSubmittedCalc(null);
  };

  const handleClearDrug = () => {
    setSelectedDrug(null);
    setSubmittedCalc(null);
  };

  // Deep-link prefill: ?ndc=... (&drug=... &qty=...). The price is always refetched
  // from NADAC — nothing about the price is trusted from the URL.
  useEffect(() => {
    const rawNdc = searchParams.get("ndc");
    const rawDrug = searchParams.get("drug");
    const qtyParam = searchParams.get("qty");
    // Accept legacy links wrapped in a single pair of quotes, then validate.
    const ndcParam = parseNdcParam(rawNdc);
    const drugParam = rawDrug ? rawDrug.replace(/^"([^"]*)"$/, "$1").trim() : null;
    const term = ndcParam || drugParam;
    if (!rawNdc && !drugParam) return;
    const key = `${rawNdc ?? ""}|${rawDrug ?? ""}|${qtyParam ?? ""}`;
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    // Never keep a previously selected drug's data around.
    setSelectedDrug(null);
    setSearchResults([]);
    setSubmittedCalc(null);
    setActualReimb("");
    setManualCost("");
    setPrefillError(null);
    // Quantity must be a finite, positive number (decimals allowed for mL/g).
    const parsedQty = parseQtyParam(qtyParam);
    setQuantity(parsedQty !== null ? String(parsedQty) : "");
    const qtyProblem = qtyParam !== null && parsedQty === null;

    if (rawNdc && !ndcParam) {
      setPrefillError("That drug link isn't valid, so nothing was pre-filled. Search for a drug below.");
      return;
    }
    if (!term) return;

    // Prefilling itself never consumes an allowance, but respect the gates.
    if (isGuest && guestCalcUsed) { setGuestGateOpen(true); return; }
    if (freeLimitReached) {
      setUpgradeReason(`You've used all ${FREE_MONTHLY_LIMIT} free calculations this month. Upgrade to Pro for unlimited calculations, unlimited contract rules, and full history.`);
      setUpgradeOpen(true);
      return;
    }

    (async () => {
      setPrefilling(true);
      // Some CMS rows store the NDC with stray quote characters; search on digits only.
      const digitsOnly = (v: string) => v.replace(/\D/g, "");
      const fetchTerm = ndcParam ? (digitsOnly(ndcParam) || ndcParam) : term;
      const res = await nadacApi.search(fetchTerm, 50);
      setPrefilling(false);
      if (!res.success) {
        setPrefillError("We couldn't load NADAC pricing just now. Try again, or search for a drug below.");
        return;
      }
      const list = res.data ?? [];
      // Compare on digits only, but never drop leading zeros from what we display.
      const normalize = (v: string) => v.replace(/\D/g, "");
      let match: DrugData | null = null;
      if (ndcParam) {
        match =
          list.find((d) => d.ndc === ndcParam) ??
          list.find((d) => normalize(d.ndc) === normalize(ndcParam)) ??
          list.find((d) => normalize(d.ndc).replace(/^0+/, "") === normalize(ndcParam).replace(/^0+/, "")) ??
          null;
      } else {
        match = list[0] ?? null;
      }
      if (!match) {
        setSearchTerm(drugParam ?? term);
        setPrefillError(
          ndcParam
            ? `We couldn't find current NADAC pricing for NDC ${ndcParam}. Search for another drug below.`
            : `We couldn't find current NADAC pricing for "${term}". Search for another drug below.`
        );
        return;
      }
      if (!Number.isFinite(match.nadacPerUnit) || match.nadacPerUnit <= 0) {
        setSearchTerm(match.drugName);
        setPrefillError(`NADAC doesn't publish a unit price for ${match.drugName} right now, so it can't be calculated. Choose another drug below.`);
        return;
      }
      setSelectedDrug(match);
      if (qtyProblem) {
        setPrefillError("We couldn't read the quantity from that link, so enter it below.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isGuest, guestCalcUsed, freeLimitReached]);


  // Where auth should send the user back to: this page, with their drug and quantity.
  const returnTo = useMemo(() => {
    const params = new URLSearchParams();
    const ndc = selectedDrug?.ndc ?? searchParams.get("ndc");
    const drug = selectedDrug?.drugName ?? searchParams.get("drug");
    if (ndc) params.set("ndc", ndc);
    if (drug) params.set("drug", drug);
    const qty = parseFloat(quantity);
    if (Number.isFinite(qty) && qty > 0) params.set("qty", String(qty));
    const qs = params.toString();
    return qs ? `/reimbursement-calculator?${qs}` : `/reimbursement-calculator${location.search ?? ""}`;
  }, [selectedDrug, quantity, searchParams, location.search]);

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
      setUpgradeReason("Free accounts can create 1 custom contract rule. Upgrade to Pro to save unlimited contract rules for different PBMs, Medicaid plans, LTC contracts, and cash pricing formulas.");
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
      setUpgradeReason("Free accounts can create 1 custom contract rule. Upgrade to Pro to save unlimited contract rules.");
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
        <main className="container py-6 md:py-10">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Pharmacy Reimbursement Calculator</h1>
            <p className="text-muted-foreground mt-3 max-w-3xl text-base">
              Estimate reimbursement and margin using real NADAC ingredient cost, your contract formulas, dispensing fees, and optional paid-claim amounts. Built for independent pharmacies.
            </p>
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

          <h2 className="sr-only">How the reimbursement calculator works</h2>
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
                description={guestCalcUsed ? `Create a free account for ${FREE_MONTHLY_LIMIT} calculations a month and 1 custom contract rule — plus 7 days of Pro free.` : `You can run one full reimbursement estimate as a guest. Sign up free for ${FREE_MONTHLY_LIMIT} calculations a month and your own contract rules.`}
                returnTo={returnTo}
              />
            </div>
          )}

          {user && !isSubscribed && (
            <div className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Unlock unlimited calculations, rules, saved history, and CSV export</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Free plan: {monthlyUsage}/{FREE_MONTHLY_LIMIT} calculations used this month, 1 custom contract rule. Pro: unlimited everything, plus printable reports.</div>
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
                      <div className="relative flex-1">
                        <Input
                          placeholder="Drug name or NDC"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown" && showSuggestions) {
                              e.preventDefault();
                              setSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
                            } else if (e.key === "ArrowUp" && showSuggestions) {
                              e.preventDefault();
                              setSuggestionIndex((i) => Math.max(i - 1, -1));
                            } else if (e.key === "Enter") {
                              if (showSuggestions && suggestionIndex >= 0 && suggestions[suggestionIndex]) {
                                e.preventDefault();
                                handleSelectSuggestion(suggestions[suggestionIndex]);
                              } else {
                                handleSearch();
                              }
                            } else if (e.key === "Escape") {
                              setShowSuggestions(false);
                            }
                          }}
                          autoComplete="off"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
                            <ul className="py-1 max-h-72 overflow-y-auto">
                              {suggestions.map((s, i) => (
                                <li key={`${s}-${i}`}>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                                    onMouseEnter={() => setSuggestionIndex(i)}
                                    className={`w-full px-3 py-2 text-left text-sm truncate ${suggestionIndex === i ? "bg-accent" : "hover:bg-accent/50"}`}
                                  >
                                    {s}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button onClick={handleSearch} disabled={searching}>
                        {searching ? "…" : "Search"}
                      </Button>
                    </div>

                    {prefilling && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading current NADAC pricing for your selected drug…
                      </div>
                    )}

                    {prefillError && !prefilling && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{prefillError}</AlertDescription>
                      </Alert>
                    )}

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
                              CMS effective date {formatSourceDateShort(selectedDrug.effectiveDate)} — NADAC rates carry
                              forward until CMS publishes a change
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleClearDrug}>Change</Button>
                        </div>
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
                          onChange={(e) => { setQuantity(e.target.value); setSubmittedCalc(null); }}
                        />
                      </div>
                      <div>
                        <Label>Ingredient cost (auto)</Label>
                        <Input
                          readOnly
                          value={ingredientCostPreview !== null ? formatCurrency(ingredientCostPreview) : "—"}
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
                          onChange={(e) => { setManualCost(e.target.value); setSubmittedCalc(null); }}
                          placeholder="Your acquisition cost"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Contract rule</Label>
                      <div className="flex gap-2">
                        <Select value={selectedRule?.id ?? ""} onValueChange={(v) => { setSelectedRuleId(v); setSubmittedCalc(null); }}>
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
                          {isSubscribed ? "Unlimited rules on Pro." : `Free plan: 1 custom contract rule. You have ${savedRules.length}/1.`}
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
                    description={`Create a free account to build PBM, Medicaid, LTC, and cash rules — with ${FREE_MONTHLY_LIMIT} calculations a month. Go Pro for unlimited.`}
                    returnTo={returnTo}
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
          setUpgradeReason("Free accounts can create 1 custom contract rule. Upgrade to Pro to save unlimited contract rules for different PBMs, Medicaid plans, LTC contracts, and cash pricing formulas.");
          setUpgradeOpen(true);
        }}
      />
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} featureHighlight={upgradeReason} />

      <Dialog open={guestGateOpen} onOpenChange={setGuestGateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a free account to keep calculating</DialogTitle>
            <DialogDescription>
              You've used your free guest calculation. Sign up free for {FREE_MONTHLY_LIMIT} calculations a month and your own contract rules — and unlock 7 days of Pro free with unlimited calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button asChild variant="outline"><Link to={authLink("login", returnTo)}>Log in</Link></Button>
            <Button asChild><Link to={authLink("signup", returnTo)}>Sign up free — get 7 days of Pro</Link></Button>
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
