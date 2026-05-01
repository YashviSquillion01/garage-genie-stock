import { useState } from "react";
import { useStore, type PurchaseOrder, type POItem } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Plus, PackageCheck, Search, Eye, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Draft = { productId: string; qty: number; price: number };

export default function PurchaseOrders() {
  const { pos, suppliers, products, addPO, recordDelivery } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [delivery, setDelivery] = useState<{ poId: string; productId: string } | null>(null);
  const [viewItem, setViewItem] = useState<{ poId: string; productId: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create form
  const [supplierId, setSupplierId] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([{ productId: "", qty: 0, price: 0 }]);

  // Delivery form
  const todayStr = new Date().toISOString().slice(0, 10);
  const [delForm, setDelForm] = useState({ qty: 0, price: 0, date: todayStr });

  const filtered = pos.filter(po => {
    const sup = suppliers.find(s => s.id === po.supplierId)?.name || "";
    const itemNames = po.items.map(i => products.find(p => p.id === i.productId)?.name || "").join(" ");
    const match = `${po.id} ${sup} ${itemNames}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || po.status === statusFilter;
    return match && matchStatus;
  }).sort((a, b) => b.id.localeCompare(a.id));

  const addDraftRow = () => setDrafts([...drafts, { productId: "", qty: 0, price: 0 }]);
  const removeDraftRow = (i: number) => setDrafts(drafts.filter((_, idx) => idx !== i));
  const updateDraft = (i: number, patch: Partial<Draft>) => setDrafts(drafts.map((d, idx) => idx === i ? { ...d, ...patch } : d));

  const draftTotal = drafts.reduce((s, d) => s + (d.qty || 0) * (d.price || 0), 0);

  const submitPO = () => {
    const valid = drafts.filter(d => d.productId && d.qty > 0 && d.price > 0);
    if (!supplierId || valid.length === 0) return;
    const id = addPO({ supplierId, items: valid });
    toast.success(`${id} created with ${valid.length} item${valid.length > 1 ? "s" : ""}`);
    setCreateOpen(false);
    setSupplierId("");
    setDrafts([{ productId: "", qty: 0, price: 0 }]);
  };

  const activePO = delivery ? pos.find(p => p.id === delivery.poId) : null;
  const activeItem = activePO && delivery ? activePO.items.find(i => i.productId === delivery.productId) : null;
  const activeProduct = activeItem ? products.find(p => p.id === activeItem.productId) : null;
  const remaining = activeItem ? activeItem.qty - activeItem.receivedQty : 0;
  const isFullyDelivered = activeItem ? remaining <= 0 : false;

  const openDelivery = (poId: string, productId: string) => {
    const po = pos.find(p => p.id === poId)!;
    const it = po.items.find(i => i.productId === productId)!;
    const rem = it.qty - it.receivedQty;
    setDelForm({ qty: rem, price: Math.round(rem * it.price), date: todayStr });
    setDelivery({ poId, productId });
  };

  const submitDelivery = () => {
    if (!delivery || !activeItem) return;
    if (delForm.qty <= 0 || delForm.qty > remaining || !delForm.date) return;
    recordDelivery(delivery.poId, delivery.productId, delForm.qty, delForm.price, delForm.date);
    toast.success(`Delivery recorded`);
    setDelivery(null);
  };

  const viewPO = viewItem ? pos.find(p => p.id === viewItem.poId) : null;
  const viewIt = viewPO && viewItem ? viewPO.items.find(i => i.productId === viewItem.productId) : null;
  const viewProd = viewIt ? products.find(p => p.id === viewIt.productId) : null;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Pending: "bg-info-soft text-info",
      Partial: "bg-warning-soft text-warning",
      Delivered: "bg-success-soft text-success",
    };
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s]}`}>{s}</span>;
  };

  const itemStatus = (it: POItem) => {
    if (it.receivedQty === 0) return "Pending";
    if (it.receivedQty >= it.qty) return "Delivered";
    return "Partial";
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Multi-item POs with partial deliveries, mandatory delivery dates and full history."
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
                <th className="px-4 py-3 font-medium">OEM</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Received</th>
                <th className="px-4 py-3 font-medium text-right">Row Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right w-44">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.flatMap(po => {
                const sup = suppliers.find(s => s.id === po.supplierId);
                return po.items.map((it, idx) => {
                  const prod = products.find(p => p.id === it.productId);
                  const fullDelivered = it.receivedQty >= it.qty;
                  return (
                    <tr key={`${po.id}-${it.productId}`} className="border-b last:border-0 table-row-hover">
                      <td className="px-4 py-3 font-mono text-xs">{idx === 0 ? po.id : ""}</td>
                      <td className="px-4 py-3">{idx === 0 ? <span className="font-medium">{sup?.name}</span> : ""}</td>
                      <td className="px-4 py-3">{prod?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{prod?.oem}</td>
                      <td className="px-4 py-3 text-right">{it.qty}</td>
                      <td className="px-4 py-3 text-right">{it.receivedQty}</td>
                      <td className="px-4 py-3 text-right">₹{(it.qty * it.price).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">{statusBadge(itemStatus(it))}</td>
                      <td className="px-4 py-3 text-right">
                        {fullDelivered ? (
                          <Button size="sm" variant="ghost" onClick={() => setViewItem({ poId: po.id, productId: it.productId })}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openDelivery(po.id, it.productId)}>
                            <PackageCheck className="h-3.5 w-3.5 mr-1" /> Mark Delivered
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create PO Drawer */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Purchase Order</SheetTitle>
            <SheetDescription>Add multiple items. OEM is auto-filled from the product.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addDraftRow}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-left font-medium">OEM</th>
                      <th className="px-3 py-2 text-right font-medium w-20">Qty</th>
                      <th className="px-3 py-2 text-right font-medium w-24">Price</th>
                      <th className="px-3 py-2 text-right font-medium w-24">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((d, i) => {
                      const prod = products.find(p => p.id === d.productId);
                      return (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-2">
                            <Select value={d.productId} onValueChange={v => {
                              const p = products.find(x => x.id === v);
                              updateDraft(i, { productId: v, price: d.price || (p?.price ?? 0) });
                            }}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{prod?.oem || "—"}</td>
                          <td className="px-2 py-2"><Input type="number" className="h-9 text-right" value={d.qty || ""} onChange={e => updateDraft(i, { qty: +e.target.value })} /></td>
                          <td className="px-2 py-2"><Input type="number" className="h-9 text-right" value={d.price || ""} onChange={e => updateDraft(i, { price: +e.target.value })} /></td>
                          <td className="px-3 py-2 text-right text-xs">₹{((d.qty || 0) * (d.price || 0)).toLocaleString("en-IN")}</td>
                          <td className="px-2 py-2">
                            {drafts.length > 1 && (
                              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => removeDraftRow(i)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-medium">Grand Total</td>
                      <td className="px-3 py-2 text-right font-semibold">₹{draftTotal.toLocaleString("en-IN")}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <Button className="w-full" onClick={submitPO} disabled={!supplierId || drafts.every(d => !d.productId || d.qty <= 0)}>
              Create Purchase Order
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delivery Drawer */}
      <Sheet open={!!delivery} onOpenChange={(o) => !o && setDelivery(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isFullyDelivered ? "Delivery Complete" : "Record Delivery"}</SheetTitle>
            <SheetDescription>{activePO?.id} · {activeProduct?.name}</SheetDescription>
          </SheetHeader>
          {activeItem && activeProduct && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-3 bg-muted/40">
                  <div className="text-[11px] text-muted-foreground">Ordered</div>
                  <div className="text-lg font-semibold mt-0.5">{activeItem.qty}</div>
                </div>
                <div className="rounded-lg border p-3 bg-muted/40">
                  <div className="text-[11px] text-muted-foreground">Received</div>
                  <div className="text-lg font-semibold mt-0.5">{activeItem.receivedQty}</div>
                </div>
                <div className="rounded-lg border p-3 bg-info-soft/40">
                  <div className="text-[11px] text-muted-foreground">Remaining</div>
                  <div className="text-lg font-semibold mt-0.5 text-info">{remaining}</div>
                </div>
              </div>

              {activeItem.deliveries.length > 0 && (
                <div className="rounded-lg border">
                  <div className="px-3 py-2 text-xs font-medium border-b bg-muted/40">Delivery History</div>
                  <div className="divide-y">
                    {activeItem.deliveries.map((d, i) => (
                      <div key={i} className="flex justify-between px-3 py-2 text-xs">
                        <span className="text-muted-foreground">{d.date}</span>
                        <span>{d.qty} units · ₹{d.price.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isFullyDelivered ? (
                <div className="rounded-lg border bg-success-soft/40 p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
                  <div className="text-sm font-medium text-success">Fully received — nothing left to deliver</div>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Delivery Date <span className="text-destructive">*</span></Label>
                    <Input type="date" className="mt-1.5"
                      value={delForm.date}
                      onChange={e => setDelForm({ ...delForm, date: e.target.value })} required />
                    <p className="text-xs text-muted-foreground mt-1.5">Mandatory — must be set before recording.</p>
                  </div>
                  <div>
                    <Label>Delivery Quantity (≤ {remaining})</Label>
                    <Input type="number" max={remaining} className="mt-1.5"
                      value={delForm.qty || ""}
                      onChange={e => setDelForm({ ...delForm, qty: Math.min(+e.target.value, remaining) })} />
                  </div>
                  <div>
                    <Label>Delivery Price (₹)</Label>
                    <Input type="number" className="mt-1.5"
                      value={delForm.price || ""}
                      onChange={e => setDelForm({ ...delForm, price: +e.target.value })} />
                    <p className="text-xs text-muted-foreground mt-1.5">Partial pricing supported per batch.</p>
                  </div>
                  <Button className="w-full" onClick={submitDelivery}
                    disabled={delForm.qty <= 0 || delForm.qty > remaining || !delForm.date}>
                    Record Delivery
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* View Delivery History */}
      <Sheet open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Delivery History</SheetTitle>
            <SheetDescription>{viewPO?.id} · {viewProd?.name}</SheetDescription>
          </SheetHeader>
          {viewIt && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-success-soft/40 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="text-sm font-medium text-success">Fully Delivered</div>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-right font-medium">Quantity</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewIt.deliveries.map((d, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-xs">{d.date}</td>
                        <td className="px-3 py-2 text-right">{d.qty}</td>
                        <td className="px-3 py-2 text-right">₹{d.price.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t">
                      <td className="px-3 py-2 text-xs font-medium">Total</td>
                      <td className="px-3 py-2 text-right font-semibold">{viewIt.receivedQty}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        ₹{viewIt.deliveries.reduce((s, d) => s + d.price, 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
