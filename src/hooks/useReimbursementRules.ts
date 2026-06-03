import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ReimbursementRule } from "@/lib/reimbursement";

export const useReimbursementRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<ReimbursementRule[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRules([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("reimbursement_rules")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (!error && data) {
      setRules(
        data.map((r: any) => ({
          id: r.id,
          name: r.name,
          cost_basis: r.cost_basis,
          adjustment_type: r.adjustment_type,
          percentage_value: Number(r.percentage_value),
          multiplier: Number(r.multiplier),
          dispensing_fee: Number(r.dispensing_fee),
          flat_adjustment: Number(r.flat_adjustment),
          minimum_reimbursement: r.minimum_reimbursement != null ? Number(r.minimum_reimbursement) : null,
          maximum_reimbursement: r.maximum_reimbursement != null ? Number(r.maximum_reimbursement) : null,
          notes: r.notes,
          is_default: r.is_default,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rules, loading, refresh };
};
