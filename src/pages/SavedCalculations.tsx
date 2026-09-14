import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calculator, Download, Search, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/reimbursement";

type CalcRow = {
  id: string;
  drug_name: string | null;
  ndc: string | null;
  nadac_unit_price: number | null;
  quantity: number | null;
  ingredient_cost: number | null;
  rule_name_snapshot: string | null;
  estimated_reimbursement: number | null;
  actual_reimbursement: number | null;
  difference: number | null;
  gross_margin: number | null;
  margin_percentage: number | null;
  notes: string | null;
  created_at: string;
};

const CSV_HEADERS = [
  "Date", "Drug Name", "NDC", "NADAC Unit Price", "Quantity", "Ingredient Cost",
  "Rule", "Estimated Reimbursement", "Actual Reimbursement", "Difference",
  "Gross Margin", "Margin %", "Notes",
];

const csvEscape = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const SavedCalculations = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<CalcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reimbursement_calculations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setRows((data || []) as CalcRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.drug_name, r.ndc, r.rule_name_snapshot, r.notes]
        .some((v) => v && v.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reimbursement_calculations").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted" });
    }
  };

  const exportCsv = () => {
    const lines = [CSV_HEADERS.join(",")];
    for (const r of filtered) {
      lines.push([
        new Date(r.created_at).toISOString(),
        r.drug_name,
        r.ndc,
        r.nadac_unit_price,
        r.quantity,
        r.ingredient_cost,
        r.rule_name_snapshot,
        r.estimated_reimbursement,
        r.actual_reimbursement,
        r.difference,
        r.gross_margin,
        r.margin_percentage,
        r.notes,
      ].map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reimbursement-calculations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <SiteNavigation />
      <main className="flex-1 container mx-auto px-3 md:px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Saved Calculations</h1>
            <p className="text-muted-foreground text-sm">Search and export your reimbursement history.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/reimbursement-calculator"><Calculator className="h-4 w-4 mr-2" />Calculator</Link>
            </Button>
            <Button onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{rows.length} saved {rows.length === 1 ? "calculation" : "calculations"}</CardTitle>
              <Badge variant="secondary">{filtered.length} shown</Badge>
            </div>
            <CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by drug, NDC, rule, or notes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {rows.length === 0 ? "You haven't saved any calculations yet." : "No calculations match your search."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Drug</TableHead>
                      <TableHead>NDC</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Ingredient Cost</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead className="text-right">Estimated</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const margin = r.gross_margin ?? 0;
                      const marginClass = margin > 0 ? "text-green-600" : margin < 0 ? "text-destructive" : "";
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{r.drug_name || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{r.ndc || "—"}</TableCell>
                          <TableCell className="text-right">{r.quantity ?? "—"}</TableCell>
                          <TableCell className="text-right">{r.ingredient_cost != null ? formatCurrency(Number(r.ingredient_cost)) : "—"}</TableCell>
                          <TableCell className="text-xs">{r.rule_name_snapshot || "—"}</TableCell>
                          <TableCell className="text-right">{r.estimated_reimbursement != null ? formatCurrency(Number(r.estimated_reimbursement)) : "—"}</TableCell>
                          <TableCell className="text-right">{r.actual_reimbursement != null ? formatCurrency(Number(r.actual_reimbursement)) : "—"}</TableCell>
                          <TableCell className={`text-right font-medium ${marginClass}`}>
                            {r.gross_margin != null ? formatCurrency(Number(r.gross_margin)) : "—"}
                            {r.margin_percentage != null && (
                              <div className="text-xs font-normal text-muted-foreground">
                                {Number(r.margin_percentage).toFixed(1)}%
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SavedCalculations;
