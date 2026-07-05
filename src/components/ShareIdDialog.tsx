import { useState } from "react";
import { X, Copy, Check, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/lib/notifications";
import type { Profile } from "@/lib/auth";

/**
 * Shows the user's own TraX ID (the @handle — a unique, human-friendly
 * identifier already stored on `profiles.handle`) so they can share it with
 * friends, plus a small form to follow another user by pasting their ID.
 *
 * Uses `handle` rather than the UUID because handles are what other users
 * actually see across the app (@handle everywhere), so pasting a handle is the
 * natural "friend code" flow. The UUID is never shown to end users.
 */
export function ShareIdDialog({ me, onClose }: { me: Profile; onClose: () => void }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(me.handle);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    const raw = input.trim().replace(/^@/, "").toLowerCase();
    if (!raw) return;
    if (raw === me.handle.toLowerCase()) {
      toast.error("That's your own ID");
      return;
    }
    setAdding(true);
    try {
      const { data: target, error } = await supabase
        .from("profiles")
        .select("id, handle, name")
        .ilike("handle", raw)
        .maybeSingle();
      if (error) throw error;
      if (!target) {
        toast.error("No user found with that ID");
        return;
      }
      const { data: existing } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", me.id)
        .eq("following_id", target.id)
        .maybeSingle();
      if (existing) {
        toast(`You already follow @${target.handle}`);
        return;
      }
      const { error: insErr } = await supabase
        .from("follows")
        .insert({ follower_id: me.id, following_id: target.id });
      if (insErr) throw insErr;
      void notificationService.notify({
        type: "follow",
        actorId: me.id,
        recipientId: target.id,
        actorName: me.name ?? me.handle,
      });
      qc.invalidateQueries();
      toast.success(`Now following @${target.handle}`);
      setInput("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add friend");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-background border-t sm:border border-border sm:rounded-lg p-5 pb-8 sm:pb-5 space-y-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest">Share &amp; Add friends</h2>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="size-4" /></button>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Your TraX ID</p>
          <button
            onClick={copyId}
            className="w-full flex items-center justify-between gap-3 border border-border px-3 py-3 rounded-sm hover:bg-secondary/40 transition-colors"
          >
            <span className="font-mono text-base font-bold truncate">@{me.handle}</span>
            {copied ? <Check className="size-4 text-accent shrink-0" /> : <Copy className="size-4 text-muted shrink-0" />}
          </button>
          <p className="mt-2 text-[11px] text-muted leading-relaxed">
            Share this ID with friends. They can add you by pasting it below.
          </p>
        </div>

        <form onSubmit={addFriend} className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted block">Add friend by ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="@friend_id"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="flex-1 bg-secondary/40 border border-border px-3 py-2 rounded-sm text-sm outline-none focus:border-foreground/40"
            />
            <button
              type="submit"
              disabled={adding || !input.trim()}
              className="bg-foreground text-background px-4 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50"
            >
              {adding ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
