import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, LogOut, Check, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { THEMES, useTheme } from "@/lib/theme";
import { deleteMyAccount } from "@/lib/account.functions";


type Prefs = { new_follower: boolean; likes: boolean; comments: boolean };

export function SettingsSheet({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>({ new_follower: true, likes: true, comments: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("notification_prefs").select("new_follower, likes, comments").eq("user_id", profileId).maybeSingle();
      if (data) setPrefs({ new_follower: data.new_follower, likes: data.likes, comments: data.comments });
      setLoading(false);
    })();
  }, [profileId]);

  async function toggle(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await supabase.from("notification_prefs").upsert({ user_id: profileId, ...next, updated_at: new Date().toISOString() });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const deleteAccount = useServerFn(deleteMyAccount);
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    const ok = window.confirm("Cancellare definitivamente il tuo account? Questa azione è irreversibile.");
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      setDeleting(false);
      window.alert("Errore durante la cancellazione: " + (e as Error).message);
    }
  }


  return (
    <div className="fixed inset-0 z-[100] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-auto bg-background border-t border-border rounded-t-2xl p-5 pb-10 animate-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold tracking-tight text-lg">Notifications</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-muted" /></div>
        ) : (
          <div className="divide-y divide-border">
            <Row label="New followers" desc="Tell me when someone follows me" on={prefs.new_follower} onChange={() => toggle("new_follower")} />
            <Row label="Likes" desc="Likes on my logs and reviews" on={prefs.likes} onChange={() => toggle("likes")} />
            <Row label="Comments" desc="Replies on my reviews" on={prefs.comments} onChange={() => toggle("comments")} />
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`relative rounded-xl border p-2 text-left transition-colors ${theme === t.key ? "border-accent" : "border-border"}`}
              >
                <div className="flex gap-1 mb-2">
                  {t.swatch.map((c, i) => (
                    <span key={i} className="size-4 rounded-full border border-border" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[11px] font-bold leading-tight">{t.label}</p>
                {theme === t.key && (
                  <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-accent text-accent-foreground grid place-items-center">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <button onClick={signOut} className="mt-6 w-full border border-border py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-muted">
          <LogOut className="size-4" /> Sign out
        </button>
        <button onClick={handleDelete} disabled={deleting} className="mt-3 w-full border border-destructive/40 text-destructive py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete account
        </button>

      </div>
    </div>
  );
}

function Row({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="w-full py-4 flex items-center justify-between gap-4 text-left">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[11px] text-muted">{desc}</p>
      </div>
      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${on ? "bg-accent" : "bg-secondary"}`}>
        <div className={`size-5 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`} />
      </div>
    </button>
  );
}
