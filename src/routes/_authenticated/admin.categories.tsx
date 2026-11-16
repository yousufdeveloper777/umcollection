import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog, ImageUploader, PageHeader, errMsg } from "@/components/admin/shared";
import { useRole } from "@/hooks/use-role";
import { categoriesQuery, slugify, type Category } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: CategoriesPage });

type Form = { id: string; name: string; slug: string; parent_id: string; image_url: string | null };

function CategoriesPage() {
  const qc = useQueryClient();
  const { canEdit } = useRole();
  const { data: cats = [], isLoading } = useQuery(categoriesQuery);
  const { data: counts = {} } = useQuery({ queryKey: ["products", "counts"], queryFn: async () => { const { data, error } = await supabase.from("products").select("category_id"); if (error) throw error; return data.reduce<Record<string, number>>((a, p) => { if (p.category_id) a[p.category_id] = (a[p.category_id] ?? 0) + 1; return a; }, {}); } });
  const [form, setForm] = useState<Form | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(cats, cats.findIndex(c => c.id === e.active.id), cats.findIndex(c => c.id === e.over!.id));
    qc.setQueryData(categoriesQuery.queryKey, next);
    const results = await Promise.all(next.map((c, i) => supabase.from("categories").update({ display_order: i + 1 }).eq("id", c.id)));
    if (results.some(r => r.error)) toast.error("Couldn't save the new order"); else toast.success("Order saved");
    refresh();
  }
  return <div>
    <PageHeader title="Categories" description={canEdit ? "Drag to reorder how categories appear." : undefined} actions={canEdit && <Button onClick={() => setForm({ id: "", name: "", slug: "", parent_id: "", image_url: null })}><Plus /> Add category</Button>} />
    {isLoading ? <Skeleton className="h-64" /> :
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={cats.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-border rounded-md border border-border bg-card">{cats.map(c => <Row key={c.id} c={c} parent={cats.find(p => p.id === c.parent_id)?.name} count={counts[c.id] ?? 0} canEdit={canEdit} onEdit={() => setForm({ id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id ?? "", image_url: c.image_url })} onDelete={() => setDel(c)} />)}</ul>
      </SortableContext>
    </DndContext>}
    {form && <CategoryForm initial={form} cats={cats} next={cats.length + 1} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />}
    <ConfirmDialog open={!!del} onOpenChange={o => !o && setDel(null)} title={`Delete ${del?.name}?`} description="Products in this category will be left without a category." requireType="DELETE" confirmLabel="Delete"
      onConfirm={async () => { const { error } = await supabase.from("categories").delete().eq("id", del!.id); if (error) { toast.error(errMsg(error)); throw error; } toast.success("Deleted"); refresh(); }} />
  </div>;
}

function Row({ c, parent, count, canEdit, onEdit, onDelete }: { c: Category; parent?: string | undefined; count: number; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: c.id, disabled: !canEdit });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 bg-card p-3">
    {canEdit && <button {...attributes} {...listeners} aria-label={`Reorder ${c.name}`} className="cursor-grab text-muted-foreground"><GripVertical className="size-4" /></button>}
    {c.image_url ? <img src={c.image_url} alt="" className="size-10 rounded object-cover" /> : <div className="size-10 rounded bg-secondary" />}
    <div className="min-w-0 flex-1"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}{parent ? ` · in ${parent}` : ""}</p></div>
    <span className="text-xs text-muted-foreground">{count} products</span>
    {canEdit && <><Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={onEdit}><Pencil /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${c.name}`} onClick={onDelete}><Trash2 className="text-destructive" /></Button></>}
  </li>;
}

function CategoryForm({ initial, cats, next, onClose, onSaved }: { initial: Form; cats: Category[]; next: number; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(initial); const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const payload = { name: f.name.trim(), slug: slugify(f.slug || f.name), parent_id: f.parent_id || null, image_url: f.image_url };
    const { error } = f.id ? await supabase.from("categories").update(payload).eq("id", f.id) : await supabase.from("categories").insert({ ...payload, display_order: next });
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "That slug is already used" : errMsg(error)); return; }
    toast.success("Saved"); onSaved();
  }
  return <Dialog open onOpenChange={o => !o && onClose()}><DialogContent>
    <DialogHeader><DialogTitle>{f.id ? "Edit category" : "Add category"}</DialogTitle></DialogHeader>
    <form onSubmit={save} className="space-y-4">
      <div><Label htmlFor="c-name">Name</Label><Input id="c-name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) })} /></div>
      <div><Label htmlFor="c-slug">Slug</Label><Input id="c-slug" required value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} /></div>
      <div><Label>Parent category (optional)</Label><Select value={f.parent_id || "none"} onValueChange={v => setF({ ...f, parent_id: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{cats.filter(c => c.id !== f.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Image</Label><div className="mt-2"><ImageUploader multiple={false} folder="categories" images={f.image_url ? [f.image_url] : []} primary={f.image_url} onChange={(imgs) => setF({ ...f, image_url: imgs[0] ?? null })} /></div></div>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
