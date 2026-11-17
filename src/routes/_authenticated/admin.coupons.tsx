import { adminHead } from "@/lib/admin-head";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog, FilterSelect, PageHeader, errMsg } from "@/components/admin/shared";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-data";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => adminHead("Coupons"),
  component: CouponsPage,
});

const blank = { code: "", discount_type: "percentage", discount_value: "10", min_order_amount: "0", max_uses: "", per_user_limit: "", expires_at: "" };

function CouponsPage() {
  const { canEdit } = useRole(); const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: async () => { const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const [open, setOpen] = useState(false); const [form, setForm] = useState(blank); const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]); const [confirm, setConfirm] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const num = (v: string) => (v.trim() ? Number(v) : null);
    const { error } = await supabase.from("coupons").insert({ code: form.code.trim().toUpperCase(), discount_type: form.discount_type, discount_value: Number(form.discount_value), min_order_amount: Number(form.min_order_amount || 0), max_uses: num(form.max_uses), per_user_limit: num(form.per_user_limit), expires_at: form.expires_at ? new Date(form.expires_at + "T23:59:59").toISOString() : null });
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "That code already exists" : errMsg(error)); return; }
    toast.success("Coupon created"); setOpen(false); setForm(blank); refresh();
  }
  async function toggle(id: string, is_active: boolean) { const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id); if (error) toast.error(errMsg(error)); refresh(); }
  const f = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return <div>
    <PageHeader title="Coupons" description="Discount codes customers can enter at checkout." actions={canEdit && <>
      {selected.length > 0 && <Button variant="destructive" onClick={() => setConfirm(true)}><Trash2 /> Delete {selected.length}</Button>}
      <Button onClick={() => setOpen(true)}><Plus /> New coupon</Button></>} />
    <div className="rounded-md border border-border bg-background"><Table>
      <TableHeader><TableRow>{canEdit && <TableHead className="w-8" />}<TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Min. order</TableHead><TableHead>Used</TableHead><TableHead>Total given</TableHead><TableHead>Expires</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
      <TableBody>
        {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No coupons yet.</TableCell></TableRow>}
        {data.map(c => <TableRow key={c.id}>
          {canEdit && <TableCell><input type="checkbox" aria-label={`Select ${c.code}`} checked={selected.includes(c.id)} onChange={e => setSelected(e.target.checked ? [...selected, c.id] : selected.filter(x => x !== c.id))} /></TableCell>}
          <TableCell className="font-mono">{c.code}</TableCell>
          <TableCell>{c.discount_type === "percentage" ? `${c.discount_value}%` : formatPrice(c.discount_value)}</TableCell>
          <TableCell>{formatPrice(c.min_order_amount)}</TableCell>
          <TableCell>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
          <TableCell>{formatPrice(c.total_discount)}</TableCell>
          <TableCell>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</TableCell>
          <TableCell><Switch checked={c.is_active} disabled={!canEdit} onCheckedChange={v => toggle(c.id, v)} aria-label={`Toggle ${c.code}`} /></TableCell>
        </TableRow>)}
      </TableBody></Table></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>New coupon</DialogTitle></DialogHeader>
      <form onSubmit={create} className="space-y-3">
        <div><Label htmlFor="cp-code">Code</Label><Input id="cp-code" required maxLength={40} value={form.code} onChange={f("code")} placeholder="EID10" /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Type</Label><FilterSelect label="Discount type" value={form.discount_type} onChange={v => setForm({ ...form, discount_type: v })} options={[["percentage", "Percentage"], ["fixed", "Fixed amount (Rs)"]]} /></div><div><Label htmlFor="cp-val">Value</Label><Input id="cp-val" type="number" min={0} required value={form.discount_value} onChange={f("discount_value")} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="cp-min">Minimum order (Rs)</Label><Input id="cp-min" type="number" min={0} value={form.min_order_amount} onChange={f("min_order_amount")} /></div><div><Label htmlFor="cp-exp">Expiry date</Label><Input id="cp-exp" type="date" value={form.expires_at} onChange={f("expires_at")} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="cp-max">Total uses limit</Label><Input id="cp-max" type="number" min={1} value={form.max_uses} onChange={f("max_uses")} placeholder="Unlimited" /></div><div><Label htmlFor="cp-per">Per customer limit</Label><Input id="cp-per" type="number" min={1} value={form.per_user_limit} onChange={f("per_user_limit")} placeholder="Unlimited" /></div></div>
        <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create coupon"}</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Delete coupons?" description={`${selected.length} coupon(s) will be removed. Customers will no longer be able to use them.`} confirmLabel="Delete" onConfirm={async () => { const { error } = await supabase.from("coupons").delete().in("id", selected); if (error) { toast.error(errMsg(error)); return; } setSelected([]); refresh(); toast.success("Deleted"); }} />
  </div>;
}
