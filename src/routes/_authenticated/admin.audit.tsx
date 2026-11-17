import { adminHead } from "@/lib/admin-head";
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
import { FilterSelect, PageHeader, downloadCsv } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({ head: () => adminHead("Audit logs"), component: AuditPage });

type Log = Tables<"audit_logs">;

function AuditPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "audit"], queryFn: async () => { const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(1000); if (error) throw error; return data; } });
  const [action, setAction] = useState("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [resource, setResource] = useState("all");
  const rows = data.filter(l => (resource === "all" || l.resource_type === resource) && (action === "all" || l.action === action) && (!from || l.created_at >= from) && (!to || l.created_at.slice(0, 10) <= to));
  const columns: ColumnDef<Log, any>[] = [
    { accessorKey: "created_at", header: "When", cell: ({ row }) => <span className="whitespace-nowrap">{format(new Date(row.original.created_at), "d MMM yyyy, HH:mm")}</span> },
    { accessorKey: "actor_name", header: "Admin", cell: ({ row }) => row.original.actor_name ?? row.original.actor_id },
    { accessorKey: "action", header: "Action", cell: ({ row }) => <Badge variant={row.original.action === "DELETE" ? "destructive" : row.original.action === "CREATE" ? "default" : "secondary"}>{row.original.action}</Badge> },
    { accessorKey: "resource_type", header: "Resource" },
    { id: "item", header: "Item", cell: ({ row }) => (row.original.details as { name?: string } | null)?.name ?? row.original.resource_id },
  ];
  return <div>
    <PageHeader title="Audit logs" actions={<Button variant="outline" onClick={() => downloadCsv("audit-logs.csv", rows.map(l => ({ timestamp: l.created_at, admin: l.actor_name, action: l.action, resource: l.resource_type, resource_id: l.resource_id, details: JSON.stringify(l.details) })))}><Download /> Export CSV</Button>} />
    <DataTable columns={columns} data={rows} loading={isLoading} empty="No activity yet." searchPlaceholder="Search admin or item" searchFn={(l, q) => `${l.actor_name} ${l.resource_type} ${(l.details as { name?: string } | null)?.name ?? ""}`.toLowerCase().includes(q)}
      toolbar={<>
        <FilterSelect value={action} onChange={setAction} label="Action" options={[["all", "All actions"], ["CREATE", "Create"], ["UPDATE", "Update"], ["DELETE", "Delete"]]} />
        <FilterSelect value={resource} onChange={setResource} label="Resource" options={[["all", "All resources"], ...Array.from(new Set(data.map(l => l.resource_type))).map(r => [r,r] as [string,string])]} />
        <Input type="date" aria-label="From date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-auto bg-background" />
        <Input type="date" aria-label="To date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-auto bg-background" />
      </>} />
  </div>;
}
