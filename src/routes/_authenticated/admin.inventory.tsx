import { AdminImage } from "@/components/admin/AdminImage";
import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog, FilterSelect, PageHeader, StatusBadge, downloadCsv, errMsg } from "@/components/admin/shared";
import { adminHead } from "@/lib/admin-head";
import { isLowStock } from "@/lib/admin-permissions";
import { parseInventoryCsv } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/admin/inventory")({ head: () => adminHead("Inventory"), component: InventoryPage });
type Product = Tables<"products">;

function InventoryPage() {
  const qc = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState<{ id: string; stock: number }[] | null>(null);
  const { data = [], isLoading } = useQuery({ queryKey: ["products", "inventory"], queryFn: async () => {
    const result = await supabase.from("products").select("*").order("name");
    if (result.error) throw result.error;
    return result.data;
  } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["admin"] }); };
  const rows = data.filter(p => filter === "all" || (filter === "out" ? p.stock === 0 : isLowStock(p.stock, p.low_stock_threshold)));
  const columns: ColumnDef<Product, unknown>[] = [
    { accessorKey: "name", header: "Product", cell: ({ row }) => <div className="flex items-center gap-3"><AdminImage src={row.original.primary_image ?? row.original.images[0]} alt="" className="size-10 rounded object-cover" /><div><p className="font-medium">{row.original.name}</p><p className="text-xs text-muted-foreground">{row.original.sku || "—"}</p></div></div> },
    { accessorKey: "stock", header: "Stock", cell: ({ row }) => <span className={isLowStock(row.original.stock, row.original.low_stock_threshold) ? "font-semibold text-destructive" : ""}>{row.original.stock}</span> },
    { accessorKey: "low_stock_threshold", header: "Low-stock threshold" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "edit", header: "Adjust stock", enableSorting: false, cell: ({ row }) => <StockEditor product={row.original} onSaved={refresh} /> },
  ];
  async function importFile(upload: File) {
    try { setPending(parseInventoryCsv(await upload.text(), new Set(data.map(p => p.id)))); }
    catch (error) { toast.error(errMsg(error)); }
  }
  return <div>
    <PageHeader title="Inventory" actions={<>
      <Button variant="outline" onClick={() => downloadCsv("inventory.csv", rows.map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, low_stock_threshold: p.low_stock_threshold })))}><Download /> Export CSV</Button>
      <Button variant="outline" onClick={() => file.current?.click()}><Upload /> Import CSV</Button>
      <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { const upload = e.target.files?.[0]; if (upload) void importFile(upload); e.target.value = ""; }} />
    </>} />
    <DataTable columns={columns} data={rows} loading={isLoading} searchPlaceholder="Search product or SKU" searchFn={(p,q) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(q)} toolbar={<FilterSelect value={filter} label="Stock level" onChange={setFilter} options={[["all","All stock"],["low","Low stock"],["out","Out of stock"]]} />} />
    <ConfirmDialog open={!!pending} onOpenChange={open => !open && setPending(null)} title="Import stock quantities?" description={`Replace stock quantities for ${pending?.length ?? 0} products from this file?`} onConfirm={async () => {
      if (!pending) return;
      const result = await supabase.rpc("admin_import_stock", { _items: pending });
      if (result.error) { toast.error(errMsg(result.error)); throw result.error; }
      toast.success("Inventory imported"); refresh();
    }} />
  </div>;
}

function StockEditor({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [stock, setStock] = useState(String(product.stock));
  const [threshold, setThreshold] = useState(String(product.low_stock_threshold));
  const [busy, setBusy] = useState(false);
  async function save() {
    const n = Number(stock); const t = Number(threshold);
    if (!stock.trim() || !threshold.trim() || !Number.isSafeInteger(n) || n < 0 || !Number.isSafeInteger(t) || t < 0) { toast.error("Enter whole numbers of zero or more"); return; }
    setBusy(true);
    const result = await supabase.from("products").update({ stock: n, low_stock_threshold: t, status: product.status === "draft" ? "draft" : n === 0 ? "out_of_stock" : "active" }).eq("id", product.id).select("id").single();
    setBusy(false);
    if (result.error) { toast.error(errMsg(result.error)); return; }
    toast.success("Stock updated"); onSaved();
  }
  return <div className="flex items-center gap-2"><Input type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} aria-label={`Stock for ${product.name}`} className="h-8 w-20" /><Input type="number" min={0} value={threshold} onChange={e => setThreshold(e.target.value)} aria-label={`Low-stock threshold for ${product.name}`} className="h-8 w-20" /><Button size="icon" variant="outline" aria-label={`Save stock for ${product.name}`} title="Save stock and threshold" disabled={busy} onClick={save}><Save /></Button></div>;
}