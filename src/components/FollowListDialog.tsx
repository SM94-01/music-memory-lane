import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Loader2, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { notificationService } from "@/lib/notifications";

type Mode = "followers" | "following";
type UserRow = { id: string; handle: string; name: string; avatar_url: string | null };

export function FollowListDialog({
  profileId,
  mode,
  onClose,
}: {
  profileId: string;
  mode: Mode;
  onClose: () => void;
}) {
  const { data: me } = useMyProfile();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const col = mode === "followers" ? "follower_id" : "following_id";
      const otherCol = mode === "followers" ? "following_id" : "follower_id";
      const { data: rels } = await supabase
        .from("follows")
        .select(`${col}`)
        .eq(otherCol, profileId);
      const ids = (rels ?? []).map((r: any) => r[col]);
      if (ids.length === 0) {
        setUsers([]);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, handle, name, avatar_url")
        .in("id", ids);
      setUsers((profs as UserRow[]) ?? []);

      if (me) {
        const { data: myFollowing } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", me.id)
          .in("following_id", ids);
        setFollowingSet(new Set((myFollowing ?? []).map((f) => f.following_id)));
      }
    })();
  }, [profileId, mode, me]);

  async function toggleFollow(u: UserRow) {
    if (!me || u.id === me.id) return;
    const isFollowing = followingSet.has(u.id);
    const next = new Set(followingSet);
    if (isFollowing) {
      next.delete(u.id);
      setFollowingSet(next);
      await supabase.from("follows").delete().eq("follower_id", me.id).eq("following_id", u.id);
    } else {
      next.add(u.id);
      setFollowingSet(next);
      await supabase.from("follows").insert({ follower_id: me.id, following_id: u.id });
      void notificationService.notify({
        type: "follow",
        actorId: me.id,
        recipientId: u.id,
        actorName: me.name ?? me.handle,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80" />
      <div
        className="relative w-full max-w-md mx-auto bg-background border-t border-border rounded-t-2xl p-5 pb-10 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold tracking-tight text-lg capitalize">{mode}</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>

        {!users ? (
          <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted" /></div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No {mode} yet.</p>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => {
              const isMe = me?.id === u.id;
              const following = followingSet.has(u.id);
              return (
                <li key={u.id} className="flex items-center gap-3">
                  <Link to="/u/$handle" params={{ handle: u.handle }} onClick={onClose}>
                    <Avatar handle={u.handle} name={u.name} url={u.avatar_url} size={44} />
                  </Link>
                  <Link to="/u/$handle" params={{ handle: u.handle }} onClick={onClose} className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{u.name}</p>
                    <p className="text-[11px] text-muted truncate">@{u.handle}</p>
                  </Link>
                  {!isMe && (
                    <button
                      onClick={() => toggleFollow(u)}
                      className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                        following ? "border border-border text-muted" : "bg-foreground text-background"
                      }`}
                    >
                      {following ? <><Check className="size-3" /> Following</> : <><UserPlus className="size-3" /> Follow</>}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
