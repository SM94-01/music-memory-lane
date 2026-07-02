import { createContext, useCallback, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type Ctx = {
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;

    // Initial session fetch: local restore, no route/navigation work during input focus.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!active) return;
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

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    // On Capacitor, window.location.origin is `https://localhost` which is not
    // a valid Supabase redirect. Only pass emailRedirectTo on real web origins.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const isCapacitor = origin.includes("localhost") || origin.startsWith("capacitor://") || origin.startsWith("file://");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name?.trim() || "" },
        ...(isCapacitor ? {} : { emailRedirectTo: origin }),
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        throw new Error("Questa email è già registrata. Effettua l'accesso.");
      }
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setSession(null);
  }, [qc]);

  const value = useMemo(
    () => ({ session, loading, signUp, signIn, signOut }),
    [session, loading, signUp, signIn, signOut],
  );

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
