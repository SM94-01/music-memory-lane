import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ProfileView } from "@/components/ProfileView";
import { useMyProfile } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TraX" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: me, isLoading } = useMyProfile();
  return (
    <MobileShell>
      {isLoading || !me ? (
        <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted" /></div>
      ) : (
        <ProfileView profile={me} fromProfile />
      )}
    </MobileShell>
  );
}
