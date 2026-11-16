import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, FileText, FolderTree, LayoutDashboard, LogOut, Package, ScrollText, Settings, TicketPercent, ShoppingBag, Users } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: staff } = user ? await supabase.rpc("is_staff", { _user_id: user.id }) : { data: false };
    if (!staff) { toast.error("Access denied."); throw redirect({ to: "/" }); }
  },
  head: () => ({ meta: [{ title: "Admin | U M Collection" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/audit", label: "Audit logs", icon: ScrollText },
] as const;

function AdminSidebar() {
  const path = useRouterState({ select: s => s.location.pathname.replace(/\/$/, "") });
  const { state, setOpenMobile } = useSidebar();
  return <Sidebar collapsible="icon">
    <SidebarHeader><Link to="/admin" className="px-2 py-1 font-display text-2xl">{state === "collapsed" ? "UM" : "U M Collection"}</Link></SidebarHeader>
    <SidebarContent><SidebarGroup><SidebarGroupLabel>Manage</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
      {nav.map(n => <SidebarMenuItem key={n.to}><SidebarMenuButton asChild isActive={path === n.to} tooltip={n.label}><Link to={n.to} onClick={() => setOpenMobile(false)}><n.icon /><span>{n.label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}
    </SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
  </Sidebar>;
}

function AdminLayout() {
  const { profile, user, roles } = useRole();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function logout() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }
  const role = roles.find(r => r !== "customer");
  return <SidebarProvider>
    <div className="flex min-h-screen w-full bg-muted/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background px-3">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm sm:inline">{profile?.full_name || user?.email}</span>
            {role && <Badge variant="outline" className="hidden capitalize sm:inline-flex">{role.replace("_", " ")}</Badge>}
            <Button asChild variant="ghost" size="sm"><a href="/" target="_blank" rel="noreferrer"><ExternalLink /> <span className="hidden sm:inline">View store</span></a></Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut /> <span className="hidden sm:inline">Logout</span></Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  </SidebarProvider>;
}
