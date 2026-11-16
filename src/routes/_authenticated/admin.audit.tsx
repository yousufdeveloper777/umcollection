import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/data-table";
import { FilterSelect, PageHeader } from "@/components/admin/shared";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: AuditPage });

type Log = Tables<"audit_logs">;

function AuditPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "audit"], queryFn: async () => { const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(1000); if (error) throw error; return data; } });
  const [action, setAction] = useState("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const rows = data.filter(l => (action === "all" || l.action === action) && (!from || l.created_at >= from) && (!to || l.created_at.slice(0, 10) <= to));
  const columns: ColumnDef<Log, any>[] = [
    { accessorKey: "created_at", header: "When", cell: ({ row }) => <span className="whitespace-nowrap">{format(new Date(row.original.created_at), "d MMM yyyy, HH:mm")}</span> },
    { accessorKey: "actor_name", header: "Admin", cell: ({ row }) => row.original.actor_name ?? row.original.actor_id },
    { accessorKey: "action", header: "Action", cell: ({ row }) => <Badge variant={row.original.action === "DELETE" ? "destructive" : row.original.action === "CREATE" ? "default" : "secondary"}>{row.original.action}</Badge> },
    { accessorKey: "resource_type", header: "Resource" },
    { id: "item", header: "Item", cell: ({ row }) => (row.original.details as { name?: string } | null)?.name ?? row.original.resource_id },
  ];
  return <div>
    <PageHeader title="Audit logs" description="Every change made in the admin panel. Read-only." />
    <DataTable columns={columns} data={rows} loading={isLoading} empty="No activity yet." searchPlaceholder="Search admin or item" searchFn={(l, q) => `${l.actor_name} ${l.resource_type} ${(l.details as { name?: string } | null)?.name ?? ""}`.toLowerCase().includes(q)}
      toolbar={<>
        <FilterSelect value={action} onChange={setAction} label="Action" options={[["all", "All actions"], ["CREATE", "Create"], ["UPDATE", "Update"], ["DELETE", "Delete"]]} />
        <Input type="date" aria-label="From date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-auto bg-background" />
        <Input type="date" aria-label="To date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-auto bg-background" />
      </>} />
  </div>;
}
