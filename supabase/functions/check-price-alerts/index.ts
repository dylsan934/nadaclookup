import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PRICE-ALERTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireServiceRole(req, corsHeaders);
  if (authError) return authError;


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("ERROR: RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const resend = new Resend(resendKey);

  try {
    logStep("Starting price alert check");

    // Get all saved drugs with user emails
    const { data: savedDrugs, error: savedError } = await supabase
      .from("saved_drugs")
      .select(`
        id,
        user_id,
        ndc,
        drug_name,
        last_notified_price
      `);

    if (savedError) throw savedError;
    if (!savedDrugs || savedDrugs.length === 0) {
      logStep("No saved drugs found");
      return new Response(JSON.stringify({ message: "No saved drugs to check" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found saved drugs", { count: savedDrugs.length });

    let alertsSent = 0;

    for (const drug of savedDrugs) {
      // Get current price from nadac_drugs
      const { data: priceData, error: priceError } = await supabase
        .from("nadac_drugs")
        .select("nadac_per_unit, effective_date")
        .eq("ndc", drug.ndc)
        .order("effective_date", { ascending: false })
        .limit(1)
        .single();

      if (priceError || !priceData) {
        logStep("No price found for drug", { ndc: drug.ndc });
        continue;
      }

      const currentPrice = Number(priceData.nadac_per_unit);
      const lastPrice = drug.last_notified_price ? Number(drug.last_notified_price) : null;

      // Skip if no previous price recorded
      if (lastPrice === null) {
        // Initialize the last notified price
        await supabase
          .from("saved_drugs")
          .update({ 
            last_notified_price: currentPrice,
            last_notified_at: new Date().toISOString()
          })
          .eq("id", drug.id);
        continue;
      }

      // Check if price changed by more than 1%
      const priceChangePercent = ((currentPrice - lastPrice) / lastPrice) * 100;
      
      if (Math.abs(priceChangePercent) >= 1) {
        logStep("Price change detected", { 
          ndc: drug.ndc, 
          oldPrice: lastPrice, 
          newPrice: currentPrice,
          changePercent: priceChangePercent.toFixed(2)
        });

        // Get user email from auth.users (using service role key for secure access)
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(drug.user_id);

        if (authError || !authUser?.user?.email) {
          logStep("Could not find user email", { userId: drug.user_id });
          continue;
        }

        const userEmail = authUser.user.email;

        const direction = priceChangePercent > 0 ? "increased" : "decreased";
        const formattedOldPrice = lastPrice.toFixed(4);
        const formattedNewPrice = currentPrice.toFixed(4);
        const formattedChange = Math.abs(priceChangePercent).toFixed(2);

        // Send email alert
        try {
          await resend.emails.send({
            from: "NADAC Alerts <onboarding@resend.dev>",
            to: [userEmail],
            subject: `Price Alert: ${drug.drug_name} ${direction} by ${formattedChange}%`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">NADAC Price Alert</h2>
                <p>The price for <strong>${drug.drug_name}</strong> (NDC: ${drug.ndc}) has ${direction}.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Previous Price:</strong> $${formattedOldPrice}/unit</p>
                  <p style="margin: 0 0 10px 0;"><strong>Current Price:</strong> $${formattedNewPrice}/unit</p>
                  <p style="margin: 0; color: ${priceChangePercent > 0 ? '#dc2626' : '#16a34a'};">
                    <strong>Change:</strong> ${priceChangePercent > 0 ? '+' : ''}${formattedChange}%
                  </p>
                </div>
                <p style="color: #666; font-size: 14px;">
                  You're receiving this alert because you saved this drug in your NADAC Pro watchlist.
                </p>
              </div>
            `,
          });

          alertsSent++;
          logStep("Alert sent", { email: userEmail, drug: drug.drug_name });

          // Update last notified price and log the alert
          await supabase
            .from("saved_drugs")
            .update({ 
              last_notified_price: currentPrice,
              last_notified_at: new Date().toISOString()
            })
            .eq("id", drug.id);

          await supabase
            .from("price_alerts")
            .insert({
              user_id: drug.user_id,
              saved_drug_id: drug.id,
              drug_name: drug.drug_name,
              ndc: drug.ndc,
              old_price: lastPrice,
              new_price: currentPrice,
              price_change_percent: priceChangePercent,
            });

        } catch (emailError) {
          logStep("Failed to send email", { error: emailError });
        }
      }
    }

    logStep("Price alert check completed", { alertsSent });

    return new Response(JSON.stringify({ 
      message: "Price alert check completed",
      alertsSent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
