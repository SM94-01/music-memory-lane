import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/auth";
import { X, Loader2 } from "lucide-react";
import { IDENTITIES, computeTasteStats, identityByKey } from "@/lib/identities";

export function EditProfileDialog({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bioShort, setBioShort] = useState(profile.bio_short ?? "");
  const [bioLong, setBioLong] = useState(profile.bio_long ?? "");
  const initialIdentity = identityByKey(profile.identity)?.key ?? "new-listener";
  const [identity, setIdentity] = useState<string>(initialIdentity);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // load stats to know which identities are unlocked
  const [stats, setStats] = useState<ReturnType<typeof computeTasteStats> | null>(null);
  useEffect(() => {
    (async () => {
      const [{ data: logs }, { count: wl }] = await Promise.all([
        supabase.from("album_logs").select("artist, genre, review, year").eq("user_id", profile.id),
        supabase.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      ]);
      setStats(computeTasteStats({ logs: (logs ?? []) as any, watchlistCount: wl ?? 0 }));
    })();
  }, [profile.id]);

  const unlockedCount = useMemo(() => IDENTITIES.filter((i) => stats ? i.unlocked(stats) : i.key === "new-listener").length, [stats]);
  function isUnlocked(key: string) {
    const it = IDENTITIES.find((i) => i.key === key);
    if (!it) return false;
    return stats ? it.unlocked(stats) : it.key === "new-listener";
  }

  async function save() {
    setBusy(true); setErr(null);
    const picked = identityByKey(identity);
    const identityLabel = picked ? picked.label : "New Listener";
    const { error } = await supabase.from("profiles").update({
      name, handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      bio_short: bioShort || null, bio_long: bioLong || null,
      identity: identityLabel,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    qc.invalidateQueries();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="h-full overflow-y-auto">
      <div className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold tracking-tight">Edit profile</h2>
          <button onClick={onClose} className="p-2 -m-2"><X className="size-5" /></button>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">
          Tap your avatar on the profile to change your photo.
        </p>
        <div className="space-y-4">
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></Field>
          <Field label="Handle"><input value={handle} onChange={(e) => setHandle(e.target.value)} className={inp} /></Field>

          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted mb-1.5 block">
              Identity {stats && <span className="text-accent ml-1">— {items.length}/{IDENTITIES.length} unlocked</span>}
            </span>
            <div className="relative">
              <select
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className={`${inp} appearance-none pr-8`}
              >
                {items.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.emoji} {i.label} — {i.description}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">Unlock more identities by logging albums, writing reviews, and building your list.</p>
          </div>


          <Field label="Short bio"><input maxLength={80} value={bioShort} onChange={(e) => setBioShort(e.target.value)} className={inp} /></Field>
          <Field label="Long bio">
            <textarea value={bioLong} onChange={(e) => setBioLong(e.target.value)} rows={4} className={`${inp} resize-none`} />
          </Field>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button onClick={save} disabled={busy} className="w-full bg-accent text-accent-foreground py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

const inp = "w-full bg-secondary/40 border border-border rounded-sm px-3 py-2.5 text-sm outline-none focus:border-accent";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] font-mono uppercase tracking-widest text-muted mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
