import { useState, type ReactNode } from "react";
import { Loader2, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadImage } from "@/lib/upload";
import { csvCell } from "@/lib/admin-permissions";

export function PageHeader({ title, description, actions }: { title: string; description?: string | undefined; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-4xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}

/** Destructive confirmation; when requireType is set the user must type it to confirm. */
export function ConfirmDialog({ open, onOpenChange, title, description, requireType, confirmLabel = "Confirm", onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; requireType?: string; confirmLabel?: string; onConfirm: () => Promise<void> | void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return <AlertDialog open={open} onOpenChange={o => { if (!o) setText(""); onOpenChange(o); }}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      {requireType && <div className="space-y-2"><p className="text-sm">Type <strong>{requireType}</strong> to confirm.</p><Input value={text} onChange={e => setText(e.target.value)} aria-label={`Type ${requireType} to confirm`} /></div>}
      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy || (!!requireType && text !== requireType)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async e => { e.preventDefault(); setBusy(true); try { await onConfirm(); setText(""); onOpenChange(false); } finally { setBusy(false); } }}>{busy ? "Working…" : confirmLabel}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", draft: "secondary", out_of_stock: "destructive",
  pending: "secondary", processing: "outline", shipped: "outline", delivered: "default", cancelled: "destructive",
  unpaid: "secondary", paid: "default", refunded: "destructive",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusTone[status] ?? "outline"} className="whitespace-nowrap capitalize">{status.replace(/_/g, " ")}</Badge>;
}

export function ImageUploader({ images, primary, onChange, multiple = true, folder }: { images: string[]; primary?: string | null | undefined; onChange: (images: string[], primary: string | null) => void; multiple?: boolean; folder?: string }) {
  const [busy, setBusy] = useState(false);
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadImage(f, folder));
      const next = multiple ? [...images, ...urls] : urls.slice(0, 1);
      onChange(next, primary && next.includes(primary) ? primary : next[0] ?? null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
  }
  return <div className="flex flex-wrap gap-2">
    {images.map(u => <div key={u} className={`relative size-20 overflow-hidden rounded border-2 ${u === primary ? "border-primary" : "border-border"}`}>
      <img src={u} alt="" className="size-full object-cover" />
      {multiple && <button type="button" aria-label="Set as primary image" onClick={() => onChange(images, u)} className="absolute bottom-1 left-1 rounded bg-background/90 p-0.5"><Star className={`size-3 ${u === primary ? "fill-primary text-primary" : ""}`} /></button>}
      <button type="button" aria-label="Remove image" onClick={() => { const next = images.filter(x => x !== u); onChange(next, u === primary ? next[0] ?? null : primary ?? null); }} className="absolute right-1 top-1 rounded bg-background/90 p-0.5"><X className="size-3" /></button>
    </div>)}
    <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-input text-[10px] text-muted-foreground hover:bg-secondary">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{busy ? "Uploading" : "Upload"}
      <input type="file" accept="image/*" multiple={multiple} className="sr-only" disabled={busy} onChange={e => { add(e.target.files); e.target.value = ""; }} />
    </label>
  </div>;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const first = rows[0];
  if (!first) return;
  const keys = Object.keys(first);
  const csv = [keys.map(csvCell).join(","), ...rows.map(r => keys.map(k => csvCell(r[k])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

export const errMsg = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Something went wrong");

export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return <Select {...(value ? { value } : {})} onValueChange={onChange}><SelectTrigger aria-label={label} className="h-9 w-auto min-w-[140px] bg-background"><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>;
}