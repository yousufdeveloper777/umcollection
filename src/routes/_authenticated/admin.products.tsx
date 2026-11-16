import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDialog, ImageUploader, PageHeader, StatusBadge, downloadCsv, errMsg } from "@/components/admin/shared";
import { useRole } from "@/hooks/use-role";
import { categoriesQuery, formatPrice, slugify, type Product } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsPage });

type Variant = { type: string; values: string[] };
const empty = { id: "", name: "", slug: "", description: "", category_id: "", price: "0", compare_at_price: "", stock: "0", sku: "", images: [] as string[], primary_image: null as string | null, sizes: "", colors: "", status: "active" };
type FormState = typeof empty;

function ProductsPage() {
  const qc = useQueryClient();
  const { canEdit } = useRole();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data = [], isLoading } = useQuery({ queryKey: ["products", "admin"], queryFn: async () => { const { data, error } = await supabase.from("products").select("*, categories(name, slug)").order("created_at", { ascending: false }); if (error) throw error; return data as Product[]; } });
  const [cat, setCat] = useState("all"); const [status, setStatus] = useState("all"); const [stock, setStock] = useState("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Product[] | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });
  const rows = data.filter(p => (cat === "all" || p.category_id === cat) && (status === "all" || p.status === status) && (stock === "all" || (stock === "low" ? p.stock > 0 && p.stock <= 3 : stock === "out" ? p.stock <= 0 : p.stock > 3)));

  async function bulkStatus(ids: string[], s: string) {
    const { error } = await supabase.from("products").update({ status: s }).in("id", ids);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Status updated"); refresh();
  }
  const columns: ColumnDef<Product, any>[] = [
    { id: "image", header: "Image", cell: ({ row }) => <img src={row.original.primary_image ?? row.original.images[0]} alt="" className="size-10 rounded object-cover" />, enableSorting: false },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div><p className="font-medium">{row.original.name}</p>{row.original.sku && <p className="text-xs text-muted-foreground">{row.original.sku}</p>}</div> },
    { id: "category", accessorFn: r => r.categories?.name ?? "", header: "Category" },
    { accessorKey: "price", header: "Price", cell: ({ row }) => formatPrice(row.original.price) },
    { accessorKey: "stock", header: "Stock", cell: ({ row }) => canEdit ? <InlineStock p={row.original} onSaved={refresh} /> : row.original.stock },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "created_at", header: "Created", cell: ({ row }) => <span className="whitespace-nowrap">{format(new Date(row.original.created_at), "d MMM yyyy")}</span> },
    ...(canEdit ? [{ id: "actions", header: "", enableSorting: false, cell: ({ row }: { row: { original: Product } }) => { const p = row.original; const v = (p.variants as Variant[]) ?? []; return <div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setForm({ id: p.id, name: p.name, slug: p.slug, description: p.description ?? "", category_id: p.category_id ?? "", price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", stock: String(p.stock), sku: p.sku ?? "", images: p.images, primary_image: p.primary_image, sizes: v.find(x => x.type === "Size")?.values.join(", ") ?? "", colors: v.find(x => x.type === "Colour")?.values.join(", ") ?? "", status: p.status })}><Pencil /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setToDelete([p])}><Trash2 className="text-destructive" /></Button></div>; } } as ColumnDef<Product, any>] : []),
  ];
  return <div>
    <PageHeader title="Products" description="Add, edit and manage everything in your shop." actions={canEdit && <Button onClick={() => setForm({ ...empty })}><Plus /> Add product</Button>} />
    <DataTable columns={columns} data={rows} loading={isLoading} getRowId={r => r.id} selectable={canEdit}
      searchPlaceholder="Search name or SKU" searchFn={(r, q) => r.name.toLowerCase().includes(q) || (r.sku ?? "").toLowerCase().includes(q)}
      toolbar={<>
        <FilterSelect value={cat} onChange={setCat} label="Category" options={[["all", "All categories"], ...categories.map(c => [c.id, c.name] as [string, string])]} />
        <FilterSelect value={status} onChange={setStatus} label="Status" options={[["all", "All statuses"], ["active", "Active"], ["draft", "Draft"], ["out_of_stock", "Out of stock"]]} />
        <FilterSelect value={stock} onChange={setStock} label="Stock" options={[["all", "All stock"], ["in", "In stock"], ["low", "Low (1–3)"], ["out", "None"]]} />
        <Button variant="outline" size="sm" onClick={() => downloadCsv("products.csv", rows.map(toCsv))}><Download /> Export</Button>
      </>}
      bulkActions={(sel, clear) => <>
        <FilterSelect value="" onChange={s => { bulkStatus(sel.map(p => p.id), s); clear(); }} label="Set status" options={[["active", "Set active"], ["draft", "Set draft"], ["out_of_stock", "Set out of stock"]]} />
        <Button size="sm" variant="outline" onClick={() => downloadCsv("products-selected.csv", sel.map(toCsv))}><Download /> Export CSV</Button>
        <Button size="sm" variant="destructive" onClick={() => setToDelete(sel)}><Trash2 /> Delete</Button>
      </>} />
    {form && <ProductForm initial={form} categories={categories} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />}
    <ConfirmDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)} title={`Delete ${toDelete?.length === 1 ? toDelete[0].name : `${toDelete?.length} products`}?`} description="This permanently removes the product from your store." requireType="DELETE" confirmLabel="Delete"
      onConfirm={async () => { const { error } = await supabase.from("products").delete().in("id", toDelete!.map(p => p.id)); if (error) { toast.error(errMsg(error)); throw error; } toast.success("Deleted"); refresh(); }} />
  </div>;
}

const toCsv = (p: Product) => ({ name: p.name, sku: p.sku, category: p.categories?.name, price: p.price, compare_at_price: p.compare_at_price, stock: p.stock, status: p.status, created_at: p.created_at });

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return <Select value={value || undefined} onValueChange={onChange}><SelectTrigger aria-label={label} className="h-9 w-auto min-w-[140px] bg-background"><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>;
}
export { FilterSelect };

function InlineStock({ p, onSaved }: { p: Product; onSaved: () => void }) {
  const [v, setV] = useState(String(p.stock));
  async function save() {
    const n = Math.max(0, parseInt(v) || 0);
    if (n === p.stock) return;
    const { error } = await supabase.from("products").update({ stock: n, status: n === 0 ? "out_of_stock" : p.status === "out_of_stock" ? "active" : p.status }).eq("id", p.id);
    if (error) { toast.error(errMsg(error)); setV(String(p.stock)); } else { toast.success("Stock updated"); onSaved(); }
  }
  return <Input type="number" min={0} value={v} onChange={e => setV(e.target.value)} onBlur={save} onKeyDown={e => e.key === "Enter" && (e.target as HTMLInputElement).blur()} aria-label={`Stock for ${p.name}`} className={`h-8 w-20 ${p.stock <= 3 ? "border-destructive" : ""}`} />;
}

function ProductForm({ initial, categories, onClose, onSaved }: { initial: FormState; categories: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.images.length) { toast.error("Add at least one image"); return; }
    setBusy(true);
    const list = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
    const variants: Variant[] = [{ type: "Size", values: list(f.sizes) }, { type: "Colour", values: list(f.colors) }].filter(v => v.values.length);
    const payload = { name: f.name.trim(), slug: slugify(f.slug || f.name), description: f.description || null, category_id: f.category_id || null, price: Number(f.price) || 0, compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null, stock: Math.max(0, parseInt(f.stock) || 0), sku: f.sku || null, images: f.images, primary_image: f.primary_image ?? f.images[0], image_alt: f.name.trim(), variants, status: f.status };
    const { error } = f.id ? await supabase.from("products").update(payload).eq("id", f.id) : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "That slug is already used" : errMsg(error)); return; }
    toast.success(f.id ? "Product updated" : "Product added"); onSaved();
  }
  return <Dialog open onOpenChange={o => !o && onClose()}>
    <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{f.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="p-name">Name</Label><Input id="p-name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) })} /></div>
        <div><Label htmlFor="p-slug">Slug</Label><Input id="p-slug" required value={f.slug} onChange={set("slug")} /></div>
        <div className="sm:col-span-2"><Label htmlFor="p-desc">Description</Label><Textarea id="p-desc" value={f.description} onChange={set("description")} /></div>
        <div><Label>Category</Label><Select value={f.category_id || undefined} onValueChange={v => setF({ ...f, category_id: v })}><SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Status</Label><Select value={f.status} onValueChange={v => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="out_of_stock">Out of stock</SelectItem></SelectContent></Select></div>
        <div><Label htmlFor="p-price">Price (Rs)</Label><Input id="p-price" type="number" min={0} step="0.01" required value={f.price} onChange={set("price")} /></div>
        <div><Label htmlFor="p-compare">Compare-at price (Rs)</Label><Input id="p-compare" type="number" min={0} step="0.01" value={f.compare_at_price} onChange={set("compare_at_price")} /></div>
        <div><Label htmlFor="p-stock">Stock quantity</Label><Input id="p-stock" type="number" min={0} required value={f.stock} onChange={set("stock")} /></div>
        <div><Label htmlFor="p-sku">SKU</Label><Input id="p-sku" value={f.sku} onChange={set("sku")} /></div>
        <div><Label htmlFor="p-sizes">Sizes (comma separated)</Label><Input id="p-sizes" placeholder="S, M, L" value={f.sizes} onChange={set("sizes")} /></div>
        <div><Label htmlFor="p-colors">Colours (comma separated)</Label><Input id="p-colors" placeholder="Black, Maroon" value={f.colors} onChange={set("colors")} /></div>
        <div className="sm:col-span-2"><Label>Images (star = primary)</Label><div className="mt-2"><ImageUploader images={f.images} primary={f.primary_image} onChange={(images, primary_image) => setF({ ...f, images, primary_image })} /></div></div>
        <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save product"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
