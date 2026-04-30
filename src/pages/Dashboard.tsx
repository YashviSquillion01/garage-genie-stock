import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, ClipboardList, Truck, TrendingUp, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { products, pos, partRequests, suppliers, getStock } = useStore();

  const lowStock = products.filter(p => getStock(p.id) <= p.minStock);
  const pendingPOs = pos.filter(po => po.status !== "Delivered");
  const pendingRequests = partRequests.filter(r => r.status === "Pending" || r.status === "Partially Available");
  const totalValue = products.reduce((sum, p) => sum + getStock(p.id) * p.price, 0);

  const stats = [
    { label: "Total SKUs", value: products.length, icon: Package, tint: "bg-primary-soft text-primary" },
    { label: "Low Stock Alerts", value: lowStock.length, icon: AlertTriangle, tint: "bg-warning-soft text-warning" },
    { label: "Open POs", value: pendingPOs.length, icon: ClipboardList, tint: "bg-info-soft text-info" },
    { label: "Suppliers", value: suppliers.length, icon: Truck, tint: "bg-success-soft text-success" },
  ];

  return (
    <div>
      <PageHeader
        title="Operations Overview"
        description="Real-time pulse of your garage inventory."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                <div className="text-3xl font-semibold mt-2 tracking-tight">{s.value}</div>
              </div>
              <div className={`h-10 w-10 rounded-lg ${s.tint} flex items-center justify-center`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Inventory Value</div>
              <div className="text-xs text-muted-foreground">Across all categories</div>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="text-3xl font-semibold">₹{totalValue.toLocaleString("en-IN")}</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[...new Set(products.map(p => p.categoryId))].slice(0, 3).map(cid => {
              const cat = useStore.getState().categories.find(c => c.id === cid)!;
              const v = products.filter(p => p.categoryId === cid).reduce((s, p) => s + getStock(p.id) * p.price, 0);
              const pct = totalValue ? (v / totalValue) * 100 : 0;
              return (
                <div key={cid} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{cat.name}</div>
                  <div className="font-semibold mt-1">₹{v.toLocaleString("en-IN")}</div>
                  <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Pending Part Requests</div>
            <Link to="/part-requests" className="text-xs text-primary hover:underline flex items-center gap-1">
              View <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRequests.slice(0, 4).map(r => {
              const prod = products.find(p => p.id === r.productId)!;
              return (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{prod.name}</div>
                    <div className="text-xs text-muted-foreground">{r.technician} · {r.jobRef}</div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    r.status === "Pending" ? "bg-info-soft text-info" : "bg-warning-soft text-warning"
                  }`}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Low Stock Items</div>
          <Link to="/products" className="text-xs text-primary hover:underline">Manage products</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">SKU</th>
                <th className="pb-2 font-medium">Current Stock</th>
                <th className="pb-2 font-medium">Min Level</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">All stock levels are healthy.</td></tr>
              )}
              {lowStock.map(p => {
                const stock = getStock(p.id);
                return (
                  <tr key={p.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-muted-foreground">{p.sku}</td>
                    <td className="py-3">{stock} {p.unit}</td>
                    <td className="py-3 text-muted-foreground">{p.minStock}</td>
                    <td className="py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning"
                      }`}>
                        {stock === 0 ? "Out of stock" : "Low"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
