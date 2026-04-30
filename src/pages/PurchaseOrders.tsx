import { useState } from "react";
import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Plus, PackageCheck, Search } from "lucide-react";
import { toast } from "sonner";

export default function PurchaseOrders() {
  const { pos, suppliers, products, addPO, recordDelivery } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [deliveryPoId, setDeliveryPoId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({ supplierId: "", productId: "", qty: 0, totalPrice: 0 });
  const [delivery, setDelivery] = useState({ qty: 0, price: 0 });

  const filtered = pos.filter(po => {
    const sup = suppliers.find(s => s.id === po.supplierId)?.name || "";
    const prod = products.find(p => p.id === po.productId)?.name || "";
    const matchSearch = `${po.id} ${sup} ${prod}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || po.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.id.localeCompare(a.id));

  const submitPO = () => {
    if (!form.supplierId || !form.productId || form.qty <= 0) return;
    const id = addPO(form);
    toast.success(`${id} created`);
    setCreateOpen(false);
    setForm({ supplierId: "", productId: "", qty: 0, totalPrice: 0 });
  };

  const activePO = deliveryPoId ? pos.find(po => po.id === deliveryPoId) : null;
  const remaining = activePO ? activePO.qty - activePO.receivedQty : 0;

  const submitDelivery = () => {
    if (!activePO) return;
    if (delivery.qty <= 0 || delivery.qty > remaining) return;
    recordDelivery(activePO.id, delivery.qty, delivery.price);
    toast.success(`Delivery recorded for ${activePO.id}`);
    setDeliveryPoId(null);
    setDelivery({ qty: 0, price: 0 });
  };

  const openDelivery = (poId: string) => {
    const po = pos.find(p => p.id === poId)!;
    const rem = po.qty - po.receivedQty;
    const unitPrice = po.totalPrice / po.qty;
    setDelivery({ qty: rem, price: Math.round(rem * unitPrice) });
    setDeliveryPoId(poId);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Pending: "bg-info-soft text-info",
      Partial: "bg-warning-soft text-warning",
      Delivered: "bg-success-soft text-success",
    };
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s]}`}>{s}</span>;
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Raise POs to suppliers and track deliveries with partial fulfillment."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> New PO</Button>}
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search PO, supplier, product…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} orders</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                <th className="px-4 py-3 font-medium">PO ID</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Ordered</th>
                <th className="px-4 py-3 font-medium text-right">Received</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => {
                const sup = suppliers.find(s => s.id === po.supplierId);
                const prod = products.find(p => p.id === po.productId);
                return (
                  <tr key={po.id} className="border-b last:border-0 table-row-hover">
                    <td className="px-4 py-3 font-mono text-xs">{po.id}</td>
                    <td className="px-4 py-3 font-medium">{sup?.name}</td>
                    <td className="px-4 py-3">{prod?.name}</td>
                    <td className="px-4 py-3 text-right">{po.qty}</td>
                    <td className="px-4 py-3 text-right">{po.receivedQty}</td>
                    <td className="px-4 py-3 text-right">₹{po.totalPrice.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{statusBadge(po.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {po.status !== "Delivered" ? (
                        <Button size="sm" variant="outline" onClick={() => openDelivery(po.id)}>
                          <PackageCheck className="h-3.5 w-3.5 mr-1" /> Mark as Delivered
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create PO Drawer */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Purchase Order</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Supplier</Label>
              <Select value={form.supplierId} onValueChange={v => setForm({ ...form, supplierId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={v => {
                const p = products.find(x => x.id === v);
                setForm({ ...form, productId: v, totalPrice: p ? p.price * form.qty : form.totalPrice });
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} · {p.sku}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" className="mt-1.5" value={form.qty || ""} onChange={e => {
                const qty = +e.target.value;
                const p = products.find(x => x.id === form.productId);
                setForm({ ...form, qty, totalPrice: p ? p.price * qty : form.totalPrice });
              }} />
            </div>
            <div>
              <Label>Total Price (₹)</Label>
              <Input type="number" className="mt-1.5" value={form.totalPrice || ""} onChange={e => setForm({ ...form, totalPrice: +e.target.value })} />
            </div>
            <Button className="w-full" onClick={submitPO}>Create PO</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delivery Drawer */}
      <Sheet open={!!deliveryPoId} onOpenChange={(o) => !o && setDeliveryPoId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Delivery</SheetTitle>
            <SheetDescription>{activePO?.id} · {products.find(p => p.id === activePO?.productId)?.name}</SheetDescription>
          </SheetHeader>
          {activePO && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 bg-muted/40">
                  <div className="text-xs text-muted-foreground">Ordered Qty</div>
                  <div className="text-xl font-semibold mt-1">{activePO.qty}</div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/40">
                  <div className="text-xs text-muted-foreground">Already Received</div>
                  <div className="text-xl font-semibold mt-1">{activePO.receivedQty}</div>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-info-soft/40">
                <div className="text-xs text-muted-foreground">Remaining Qty</div>
                <div className="text-xl font-semibold mt-1 text-info">{remaining}</div>
              </div>

              {activePO.deliveries.length > 0 && (
                <div className="rounded-lg border">
                  <div className="px-3 py-2 text-xs font-medium border-b bg-muted/40">Delivery History</div>
                  <div className="divide-y">
                    {activePO.deliveries.map((d, i) => (
                      <div key={i} className="flex justify-between px-3 py-2 text-xs">
                        <span className="text-muted-foreground">{d.date}</span>
                        <span>{d.qty} units · ₹{d.price.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Delivery Quantity (≤ {remaining})</Label>
                <Input
                  type="number"
                  max={remaining}
                  className="mt-1.5"
                  value={delivery.qty || ""}
                  onChange={e => setDelivery({ ...delivery, qty: Math.min(+e.target.value, remaining) })}
                />
              </div>
              <div>
                <Label>Delivery Price (₹)</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={delivery.price || ""}
                  onChange={e => setDelivery({ ...delivery, price: +e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Partial deliveries allow custom price for delivered batch.</p>
              </div>
              <Button className="w-full" onClick={submitDelivery} disabled={delivery.qty <= 0 || delivery.qty > remaining}>
                Record Delivery
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
