import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog, FilterSelect, PageHeader, errMsg } from "@/components/admin/shared";
import { useRole, type AppRole } from "@/hooks/use-role";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: CustomersPage });

type Customer = { id: string; full_name: string | null; email: string | null; is_active: boolean; created_at: string; role: AppRole; orders: number; spent: number };
const ROLES: [string, string][] = [["customer", "Customer"], ["viewer", "Viewer"], ["manager", "Manager"], ["super_admin", "Super admin"]];

function CustomersPage() {
  const qc = useQueryClient();
  const { canEdit, user } = useRole();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const [p, r, o] = await Promise.all([supabase.from("profiles").select("*").order("created_at", { ascending: false }), supabase.from("user_roles").select("user_id, role"), supabase.from("orders").select("customer_id, total, status")]);
      for (const x of [p, r, o]) if (x.error) throw x.error;
      const rank: AppRole[] = ["super_admin", "manager", "viewer", "customer"];
      return p.data!.map<Customer>(u => {
        const mine = o.data!.filter(x => x.customer_id === u.id);
        const roles = r.data!.filter(x => x.user_id === u.id).map(x => x.role);
        return { ...u, role: rank.find(k => roles.includes(k)) ?? "customer", orders: mine.length, spent: mine.filter(x => x.status !== "cancelled").reduce((s, x) => s + Number(x.total), 0) };
      });
    },
  });
  const [view, setView] = useState<Customer | null>(null);
  const [pending, setPending] = useState<{ c: Customer; role?: AppRole; active?: boolean } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  async function apply() {
    const { c, role, active } = pending!;
    if (role) {
      const del = await supabase.from("user_roles").delete().eq("user_id", c.id);
      if (del.error) { toast.error(errMsg(del.error)); throw del.error; }
      const ins = await supabase.from("user_roles").insert({ user_id: c.id, role });
      if (ins.error) { toast.error(errMsg(ins.error)); throw ins.error; }
    }
    if (active !== undefined) {
      const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", c.id);
      if (error) { toast.error(errMsg(error)); throw error; }
    }
    toast.success("User updated"); refresh(); setView(null);
  }
  const columns: ColumnDef<Customer, any>[] = [
    { accessorKey: "full_name", header: "Name", cell: ({ row }) => <span className={row.original.is_active ? "" : "text-muted-foreground line-through"}>{row.original.full_name ?? "—"}</span> },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Role", cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.role.replace("_", " ")}</Badge> },
    { accessorKey: "created_at", header: "Joined", cell: ({ row }) => format(new Date(row.original.created_at), "d MMM yyyy") },
    { accessorKey: "orders", header: "Orders" },
    { accessorKey: "spent", header: "Spent", cell: ({ row }) => formatPrice(row.original.spent) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <Button size="icon" variant="ghost" aria-label="View user" onClick={() => setView(row.original)}><Eye /></Button> },
  ];
  const self = view?.id === user?.id;
  return <div>
    <PageHeader title="Customers & users" description="Everyone with an account on your store." />
    <DataTable columns={columns} data={data} loading={isLoading} searchPlaceholder="Search name or email" searchFn={(c, q) => (c.full_name ?? "").toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)} />
    {view && <Dialog open onOpenChange={o => !o && setView(null)}><DialogContent>
      <DialogHeader><DialogTitle>{view.full_name ?? view.email}</DialogTitle></DialogHeader>
      <div className="space-y-4 text-sm">
        <p>{view.email}</p>
        <p className="text-muted-foreground">Joined {format(new Date(view.created_at), "d MMM yyyy")} · {view.orders} orders · {formatPrice(view.spent)} spent</p>
        {canEdit && !self ? <>
          <div className="flex items-center justify-between"><span>Role</span><FilterSelect value={view.role} label="Role" options={ROLES} onChange={r => setPending({ c: view, role: r as AppRole })} /></div>
          <div className="flex items-center justify-between"><span>Account active</span><Switch checked={view.is_active} onCheckedChange={v => setPending({ c: view, active: v })} aria-label="Account active" /></div>
        </> : <p className="text-xs text-muted-foreground">{self ? "You can't change your own role or status." : "Only a super admin can change roles."}</p>}
      </div>
    </DialogContent></Dialog>}
    <ConfirmDialog open={!!pending} onOpenChange={o => !o && setPending(null)} title="Confirm change"
      description={pending?.role ? `Change ${pending.c.email}'s role to ${pending.role.replace("_", " ")}?` : `${pending?.active ? "Activate" : "Deactivate"} ${pending?.c.email}?`} onConfirm={apply} />
  </div>;
}
