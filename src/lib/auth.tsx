import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type Ctx = { session: Session | null; loading: boolean };
const AuthCtx = createContext<Ctx>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession((prev) => {
        // Prevent redundant re-renders if the session identity hasn't changed.
        // Supabase sometimes fires events with new object references but same data.
        const prevId = prev?.user?.id;
        const nextId = sess?.user?.id;
        const prevToken = prev?.access_token;
        const nextToken = sess?.access_token;
        
        if (prevId === nextId && prevToken === nextToken && !!prev === !!sess) {
          return prev;
        }
        return sess;
      });

      if (event === "SIGNED_OUT") {
        qc.clear();
      } else if (event === "SIGNED_IN") {
        // Only invalidate on full sign-in to avoid loops during token refresh
        qc.invalidateQueries();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const value = useMemo(() => ({ session, loading }), [session, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function useMyProfile() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["myProfile", uid],
    enabled: !!uid,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", uid!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
