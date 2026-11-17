import { adminHead } from "@/lib/admin-head";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, FileDown } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/data-table";
import { FilterSelect, PageHeader, StatusBadge, errMsg } from "@/components/admin/shared";
import { useRole } from "@/hooks/use-role";
import { formatPrice, settingsQuery } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin/orders")({ head: () => adminHead("Orders"), component: OrdersPage });

type Order = Tables<"orders"> & { order_items: Tables<"order_items">[] };
const STATUSES: [string, string][] = [["pending", "Pending"], ["processing", "Processing"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
const PAYMENTS: [string, string][] = [["unpaid", "Unpaid"], ["paid", "Paid"], ["refunded", "Refunded"]];

function OrdersPage() {
  const qc = useQueryClient();
  const { canEdit } = useRole();
  const { data: settings } = useQuery(settingsQuery);
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "orders"], queryFn: async () => { const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }); if (error) throw error; return data as Order[]; } });
  const [status, setStatus] = useState("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [view, setView] = useState<Order | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin"] }); };
  const rows = data.filter(o => (status === "all" || o.status === status) && (!from || o.created_at >= from) && (!to || o.created_at.slice(0, 10) <= to));

  async function update(ids: string[], patch: { status?: string; payment_status?: string }) {
    const { error } = await supabase.from("orders").update(patch).in("id", ids);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Order updated"); refresh();
    if (view && ids.includes(view.id)) setView({ ...view, ...patch });
  }
  function invoice(o: Order) {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(settings?.store_name || "U M Collection", 14, 20);
    doc.setFontSize(10); doc.text([settings?.address, settings?.phone, settings?.contact_email].filter(Boolean).join(" · "), 14, 27);
    doc.setFontSize(14); doc.text(`Invoice #${o.order_number}`, 14, 42);
    doc.setFontSize(10); doc.text(`Date: ${format(new Date(o.created_at), "d MMM yyyy")}`, 14, 49);
    doc.text(["Bill to:", o.customer_name, o.customer_phone, o.customer_email ?? "", ...doc.splitTextToSize(o.address, 90)], 14, 58);
    let y = 95; doc.setFont("helvetica", "bold"); doc.text("Item", 14, y); doc.text("Qty", 120, y); doc.text("Price", 140, y); doc.text("Total", 170, y); doc.setFont("helvetica", "normal");
    for (const i of o.order_items) { y += 8; doc.text(i.product_name.slice(0, 50), 14, y); doc.text(String(i.quantity), 120, y); doc.text(formatPrice(i.unit_price), 140, y); doc.text(formatPrice(Number(i.unit_price) * i.quantity), 170, y); }
    y += 12; doc.setFont("helvetica", "bold"); doc.text(`Total: ${formatPrice(o.total)}`, 140, y);
    doc.setFont("helvetica", "normal"); doc.text(`Payment: ${o.payment_status}`, 14, y);
    doc.save(`invoice-${o.order_number}.pdf`);
  }
  const columns: ColumnDef<Order, any>[] = [
    { accessorKey: "order_number", header: "Order", cell: ({ row }) => `#${row.original.order_number}` },
    { accessorKey: "customer_name", header: "Customer", cell: ({ row }) => <div><p>{row.original.customer_name}</p><p className="text-xs text-muted-foreground">{row.original.customer_phone}</p></div> },
    { accessorKey: "total", header: "Total", cell: ({ row }) => formatPrice(row.original.total) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "payment_status", header: "Payment", cell: ({ row }) => <StatusBadge status={row.original.payment_status} /> },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => <span className="whitespace-nowrap">{format(new Date(row.original.created_at), "d MMM yyyy, HH:mm")}</span> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label="View order" onClick={() => setView(row.original)}><Eye /></Button><Button size="icon" variant="ghost" aria-label="Download invoice" onClick={() => invoice(row.original)}><FileDown /></Button></div> },
  ];
  return <div>
    <PageHeader title="Orders" description="Orders placed on your website." />
    <DataTable columns={columns} data={rows} loading={isLoading} getRowId={r => r.id} selectable={canEdit} empty="No orders yet."
      searchPlaceholder="Search customer or phone" searchFn={(o, q) => o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q) || (o.customer_email ?? "").toLowerCase().includes(q) || String(o.order_number) === q.replace("#", "")}
      toolbar={<>
        <FilterSelect value={status} onChange={setStatus} label="Status" options={[["all", "All statuses"], ...STATUSES]} />
        <Input type="date" aria-label="From date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-auto bg-background" />
        <Input type="date" aria-label="To date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-auto bg-background" />
      </>}
      bulkActions={(sel, clear) => <FilterSelect value="" label="Set status" onChange={s => { update(sel.map(o => o.id), { status: s }); clear(); }} options={STATUSES} />} />
    {view && <Dialog open onOpenChange={o => !o && setView(null)}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Order #{view.order_number}</DialogTitle></DialogHeader>
      <div className="space-y-4 text-sm">
        <div><p className="font-medium">{view.customer_name}</p><p>{view.customer_phone}{view.customer_email ? ` · ${view.customer_email}` : ""}</p><p className="whitespace-pre-line text-muted-foreground">{view.address}</p>{view.notes && <p className="mt-2 rounded bg-secondary p-2">Note: {view.notes}</p>}</div>
        <ul className="divide-y divide-border rounded border border-border">{view.order_items.map(i => <li key={i.id} className="flex justify-between p-2"><span>{i.product_name} × {i.quantity}</span><span>{formatPrice(Number(i.unit_price) * i.quantity)}</span></li>)}<li className="flex justify-between p-2 font-semibold"><span>Total</span><span>{formatPrice(view.total)}</span></li></ul>
        {canEdit ? <div className="grid grid-cols-2 gap-3"><div><Label>Order status</Label><FilterSelect value={view.status} label="Order status" onChange={s => update([view.id], { status: s })} options={STATUSES} /></div><div><Label>Payment status</Label><FilterSelect value={view.payment_status} label="Payment status" onChange={s => update([view.id], { payment_status: s })} options={PAYMENTS} /></div></div>
          : <div className="flex gap-2"><StatusBadge status={view.status} /><StatusBadge status={view.payment_status} /></div>}
        <Button variant="outline" className="w-full" onClick={() => invoice(view)}><FileDown /> Download invoice (PDF)</Button>
      </div>
    </DialogContent></Dialog>}
  </div>;
}
