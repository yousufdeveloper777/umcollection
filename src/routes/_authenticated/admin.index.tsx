import { adminHead } from "@/lib/admin-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { AlertTriangle, DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/shared";
import { formatPrice } from "@/lib/store-data";
import { isLowStock } from "@/lib/admin-permissions";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/shared";

export const Route = createFileRoute("/_authenticated/admin/")({ head: () => adminHead("Dashboard"), component: Dashboard });

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [p, o, c, a] = await Promise.all([
        supabase.from("products").select("id, name, primary_image, stock, low_stock_threshold, status"),
        supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      for (const r of [p, o, c, a]) if (r.error) throw r.error;
      return { products: p.data ?? [], orders: o.data ?? [], customers: c.count ?? 0, activity: a.data ?? [] };
    },
  });
  const orders = data?.orders ?? [];
  const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const lowProducts = (data?.products ?? []).filter(p => p.status !== "draft" && isLowStock(p.stock, p.low_stock_threshold));
  const lowStock = lowProducts.length;
  const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
  const chart = days.map(d => { const matching = orders.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")); return { day: format(d, "MMM d"), orders: matching.length, revenue: matching.filter(o => o.status !== "cancelled").reduce((sum,o) => sum + Number(o.total),0) }; });
  const kpis = [
    { label: "Total products", value: data?.products.length ?? 0, icon: Package },
    { label: "Total orders", value: orders.length, icon: ShoppingBag },
    { label: "Total revenue", value: formatPrice(revenue), icon: DollarSign },
    { label: "Total customers", value: data?.customers ?? 0, icon: Users },
    { label: "Low-stock products", value: lowStock, icon: AlertTriangle },
  ];
  return <div>
    <PageHeader title="Dashboard" actions={<Button asChild><Link to="/admin/products">Manage products</Link></Button>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{kpis.map(k => <Card key={k.label}><CardContent className="p-4"><div className="flex items-center justify-between text-xs text-muted-foreground">{k.label}<k.icon className="size-4" /></div>{isLoading ? <Skeleton className="mt-2 h-8" /> : <p className="mt-2 text-2xl font-semibold">{k.value}</p>}</CardContent></Card>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Orders over the last 30 days</CardTitle></CardHeader><CardContent>
        {orders.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No orders yet.</p> :
        <ChartContainer config={{ orders: { label: "Orders", color: "var(--primary)" } }} className="h-64 w-full">
          <AreaChart data={chart}><CartesianGrid vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} interval={6} fontSize={11} /><YAxis allowDecimals={false} width={24} fontSize={11} /><ChartTooltip content={<ChartTooltipContent />} /><Area dataKey="orders" type="monotone" stroke="var(--color-orders)" fill="var(--color-orders)" fillOpacity={0.2} /></AreaChart>
        </ChartContainer>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader><CardContent className="space-y-3">
        {isLoading ? <Skeleton className="h-24" /> : data?.activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> :
        data?.activity.map(a => <div key={a.id} className="text-sm"><p><span className="font-medium">{a.actor_name ?? "Someone"}</span> {a.action.toLowerCase()}d {a.resource_type.toLowerCase()} {(a.details as { name?: string } | null)?.name ?? ""}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p></div>)}
      </CardContent></Card>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="min-w-0"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Recent orders</h2><Button asChild variant="ghost" size="sm"><Link to="/admin/orders">View all</Link></Button></div>
        {orders.length === 0 ? <p className="border-y border-border py-6 text-sm text-muted-foreground">No orders yet.</p> : <ul className="divide-y divide-border border-y border-border">{orders.slice(0,5).map(o => <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">#{o.order_number} · {o.customer_name}</p><p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "d MMM yyyy")}</p></div><div className="flex items-center gap-3 text-sm"><StatusBadge status={o.status} />{formatPrice(o.total)}</div></li>)}</ul>}
      </section>
      <section className="min-w-0"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Low-stock alerts</h2><Button asChild variant="ghost" size="sm"><Link to="/admin/inventory">Inventory</Link></Button></div>
        {lowProducts.length === 0 ? <p className="border-y border-border py-6 text-sm text-muted-foreground">No low-stock alerts.</p> : <ul className="divide-y divide-border border-y border-border">{lowProducts.slice(0,5).map(p => <li key={p.id} className="flex items-center gap-3 py-3"><img src={p.primary_image ?? undefined} alt="" className="size-10 rounded object-cover" /><p className="min-w-0 flex-1 text-sm">{p.name}</p><span className="text-sm font-semibold text-destructive">{p.stock} left</span></li>)}</ul>}
      </section>
    </div>
  </div>;
}
