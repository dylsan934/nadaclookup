import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string;
const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string;

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export default function Unsubscribe() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const json = await res.json();
        if (json.valid) setState({ kind: "valid" });
        else if (json.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid" });
      } catch {
        setState({ kind: "invalid" });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json.success) setState({ kind: "success" });
      else if (json.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: json.error || "Failed" });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-md">
          <Card className="p-8 text-center">
            {state.kind === "loading" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Checking link…</p>
              </>
            )}
            {state.kind === "valid" && (
              <>
                <MailX className="h-10 w-10 text-primary mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Unsubscribe from NADAC Lookup emails?</h1>
                <p className="text-sm text-muted-foreground mb-6">You'll stop receiving emails from us at this address.</p>
                <Button onClick={confirm} size="lg" className="w-full">Confirm unsubscribe</Button>
              </>
            )}
            {state.kind === "submitting" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Processing…</p>
              </>
            )}
            {state.kind === "success" && (
              <>
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">You're unsubscribed</h1>
                <p className="text-sm text-muted-foreground">You will no longer receive emails from NADAC Lookup at this address.</p>
              </>
            )}
            {state.kind === "already" && (
              <>
                <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Already unsubscribed</h1>
                <p className="text-sm text-muted-foreground">This email is already opted out.</p>
              </>
            )}
            {state.kind === "invalid" && (
              <>
                <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Invalid or expired link</h1>
                <p className="text-sm text-muted-foreground">This unsubscribe link is no longer valid.</p>
              </>
            )}
            {state.kind === "error" && (
              <>
                <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">{state.message}</p>
              </>
            )}
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
