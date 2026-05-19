"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";

type UserContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  /** Re-fetch the profile row from Supabase — call after onboarding writes etc. */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

type ProviderProps = {
  initialUser: User | null;
  initialProfile: Profile | null;
  configured: boolean;
  children: React.ReactNode;
};

/**
 * Hydrates from server-rendered initial state, then subscribes to
 * supabase.auth.onAuthStateChange so the rest of the app sees sign-in /
 * sign-out without a page reload.
 */
export function UserProvider({
  initialUser,
  initialProfile,
  configured,
  children,
}: ProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      if (!supabase) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return (data as Profile | null) ?? null;
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const fresh = await fetchProfile(user.id);
    setProfile(fresh);
    setLoading(false);
  }, [fetchProfile, user]);

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await fetchProfile(u.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // Hard navigate so middleware re-runs and clears any cached server state.
    window.location.href = "/";
  }, [supabase]);

  const value: UserContextValue = {
    user,
    profile,
    loading,
    configured,
    refreshProfile,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Returns null on the server — components that call this hook must be client
 * components ("use client" at the top). Use getServerUser() in server code.
 */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    // Provider not mounted (e.g. during SSR before hydration) — return safe defaults.
    return {
      user: null,
      profile: null,
      loading: false,
      configured: isSupabaseConfigured(),
      refreshProfile: async () => {},
      signOut: async () => {},
    };
  }
  return ctx;
}
