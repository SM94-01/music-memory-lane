import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { useQueryClient } from "@tanstack/react-query";
import { X, Send, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { notificationService } from "@/lib/notifications";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user: { handle: string; name: string; avatar_url: string | null } | null;
};

export function CommentsSheet({ logId, onClose, onCountChange }: { logId: string; onClose: () => void; onCountChange?: (n: number) => void }) {
  const { session } = useAuth();
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, user:profiles!comments_user_id_fkey(handle, name, avatar_url)")
      .eq("log_id", logId)
      .order("created_at", { ascending: true });
    setComments((data as unknown as Comment[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [logId]);

  async function send() {
    if (!text.trim() || !me) return;
    setSending(true);
    const { error } = await supabase.from("comments").insert({ log_id: logId, user_id: me.id, body: text.trim() });
    if (!error) {
      void notificationService.notify({
        type: "comment",
        actorId: me.id,
        logId,
        actorName: me.name ?? me.handle,
        preview: text.trim(),
      });
    }
    setSending(false);
    if (!error) {
      setText("");
      await load();
      onCountChange?.(comments.length + 1);
      qc.invalidateQueries({ queryKey: ["feed"] });
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-auto bg-background border-t border-border rounded-t-2xl p-5 pb-6 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold tracking-tight text-lg">Comments</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4">
          {loading && <Loader2 className="size-4 animate-spin text-muted mx-auto" />}
          {!loading && comments.length === 0 && <p className="text-sm text-muted text-center py-8">No comments yet. Be the first.</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Link to="/u/$handle" params={{ handle: c.user?.handle ?? "" }} onClick={onClose}>
                <Avatar handle={c.user?.handle ?? ""} name={c.user?.name} url={c.user?.avatar_url} size={32} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/u/$handle" params={{ handle: c.user?.handle ?? "" }} onClick={onClose} className="text-sm font-bold">{c.user?.name}</Link>
                <p className="text-sm text-muted leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
        {session && (
          <div className="mt-3 flex gap-2 items-center border-t border-border pt-3">
            <input
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Add a comment…"
              className="flex-1 bg-secondary/40 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button onClick={send} disabled={sending || !text.trim()} className="size-10 bg-accent text-accent-foreground rounded-full grid place-items-center disabled:opacity-40">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
