import { useEffect, useState } from "react";
import { X, Loader2, Search, Send, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { notificationService } from "@/lib/notifications";
import { toast } from "sonner";

type Friend = { id: string; handle: string; name: string; avatar_url: string | null };

export function ShareAlbumDialog({
  albumKey,
  album,
  onClose,
}: {
  albumKey: string;
  album: { title: string; artist: string; year: number | null; cover: string | null; genre: string | null };
  onClose: () => void;
}) {
  const { data: me } = useMyProfile();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data: rels } = await supabase.from("follows").select("following_id").eq("follower_id", me.id);
      const ids = (rels ?? []).map((r) => r.following_id);
      if (ids.length === 0) { setFriends([]); return; }
      const { data: profs } = await supabase.from("profiles").select("id, handle, name, avatar_url").in("id", ids);
      setFriends((profs as Friend[]) ?? []);
    })();
  }, [me]);

  async function send(friend: Friend) {
    if (!me || sending || sent.has(friend.id)) return;
    setSending(friend.id);
    const { error } = await supabase.from("album_shares").insert({
      from_user_id: me.id,
      to_user_id: friend.id,
      album_key: albumKey,
      title: album.title,
      artist: album.artist,
      year: album.year,
      cover_url: album.cover,
      genre: album.genre,
      message: message.trim() || null,
    });
    setSending(null);
    if (error) {
      toast.error("Failed to share: " + error.message);
      return;
    }
    setSent((s) => new Set(s).add(friend.id));
    void notificationService.notify({
      type: "album_share",
      actorId: me.id,
      recipientId: friend.id,
      albumKey,
      albumTitle: album.title,
      actorName: me.name ?? me.handle,
    });
    toast.success(`Sent to ${friend.name}`);
  }

  const filtered = (friends ?? []).filter(
    (f) => !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.handle.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80" />
      <div
        className="relative w-full max-w-md mx-auto bg-background border-t border-border rounded-t-2xl p-5 pb-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h2 className="font-extrabold tracking-tight text-lg">Share album</h2>
            <p className="text-[11px] text-muted truncate">{album.title} · {album.artist}</p>
          </div>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a note (optional)…"
          rows={2}
          className="w-full bg-secondary/40 border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-accent resize-none mb-3"
        />

        <div className="relative mb-3">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search friends"
            className="w-full bg-secondary/40 border border-border rounded-sm pl-9 pr-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        {!friends ? (
          <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">
            {friends.length === 0 ? "Follow someone to share albums with them." : "No matches."}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((f) => {
              const done = sent.has(f.id);
              const busy = sending === f.id;
              return (
                <li key={f.id} className="flex items-center gap-3">
                  <Avatar handle={f.handle} name={f.name} url={f.avatar_url} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{f.name}</p>
                    <p className="text-[11px] text-muted truncate">@{f.handle}</p>
                  </div>
                  <button
                    onClick={() => send(f)}
                    disabled={done || busy}
                    className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                      done ? "border border-border text-muted" : "bg-foreground text-background"
                    } disabled:opacity-60`}
                  >
                    {busy ? <Loader2 className="size-3 animate-spin" /> : done ? <><Check className="size-3" /> Sent</> : <><Send className="size-3" /> Send</>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
