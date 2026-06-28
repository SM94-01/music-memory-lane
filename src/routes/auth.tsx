import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — TraX" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo className="h-40 w-auto mb-4" />
          <p className="text-sm text-muted mt-1">Track your music journey.</p>
        </div>

        <div className="flex gap-1 p-1 bg-secondary/60 rounded-full mb-6">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full ${mode === m ? "bg-foreground text-background" : "text-muted"}`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-secondary/40 border border-border rounded-full px-4 py-3 text-sm outline-none focus:border-accent"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-secondary/40 border border-border rounded-full px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Password (min. 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="w-full bg-secondary/40 border border-border rounded-full px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent text-accent-foreground py-3 rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-[11px] text-muted text-center mt-6 leading-relaxed">
          By continuing you agree to share your music taste with the world.
          <br />Your reviews stay yours.
        </p>
      </div>
    </div>
  );
}
