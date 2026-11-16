import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "manager" | "viewer" | "customer";

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user ?? null,
    staleTime: 60_000,
  });
}

/** Current user's roles. UI hint only — the database enforces every permission. */
export function useRole() {
  const { data: user, isLoading: userLoading } = useAuthUser();
  const q = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase.from("profiles").select("full_name, email, is_active").eq("id", user!.id).maybeSingle(),
      ]);
      return { roles: (profile?.is_active === false ? [] : (roles ?? []).map(r => r.role)) as AppRole[], profile };
    },
  });
  const roles = q.data?.roles ?? [];
  const isSuperAdmin = roles.includes("super_admin");
  const isStaff = isSuperAdmin || roles.includes("manager") || roles.includes("viewer");
  return { user, profile: q.data?.profile, roles, isSuperAdmin, isStaff, canEdit: isSuperAdmin, isLoading: userLoading || (!!user && q.isLoading) };
}
