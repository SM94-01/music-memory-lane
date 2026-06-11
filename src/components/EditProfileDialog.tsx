import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/auth";
import { X, Loader2 } from "lucide-react";

export function EditProfileDialog({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bioShort, setBioShort] = useState(profile.bio_short ?? "");
  const [bioLong, setBioLong] = useState(profile.bio_long ?? "");
  const [identity, setIdentity] = useState(profile.identity ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true); setErr(null);
    const { error } = await supabase.from("profiles").update({
      name, handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      bio_short: bioShort || null, bio_long: bioLong || null,
      identity: identity || null, avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    qc.invalidateQueries();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold tracking-tight">Edit profile</h2>
          <button onClick={onClose} className="p-2 -m-2"><X className="size-5" /></button>
        </div>
        <div className="space-y-4">
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></Field>
          <Field label="Handle"><input value={handle} onChange={(e) => setHandle(e.target.value)} className={inp} /></Field>
          <Field label="Identity"><input value={identity} placeholder="e.g. Post-Punk Purist" onChange={(e) => setIdentity(e.target.value)} className={inp} /></Field>
          <Field label="Short bio"><input maxLength={80} value={bioShort} onChange={(e) => setBioShort(e.target.value)} className={inp} /></Field>
          <Field label="Long bio">
            <textarea value={bioLong} onChange={(e) => setBioLong(e.target.value)} rows={4} className={`${inp} resize-none`} />
          </Field>
          <Field label="Avatar URL"><input value={avatarUrl} placeholder="https://…" onChange={(e) => setAvatarUrl(e.target.value)} className={inp} /></Field>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button onClick={save} disabled={busy} className="w-full bg-accent text-accent-foreground py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
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
