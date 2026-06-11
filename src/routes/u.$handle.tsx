import { createFileRoute, notFound } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ProfileView } from "@/components/ProfileView";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({ meta: [{ title: `@${params.handle} — TraX` }] }),
  component: UserPage,
});

function UserPage() {
  const { handle } = Route.useParams();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  return (
    <MobileShell>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted" /></div>
      ) : !profile ? (
        <p className="text-sm text-muted text-center py-12">User not found.</p>
      ) : (
        <ProfileView profile={profile} />
      )}
    </MobileShell>
  );
}
