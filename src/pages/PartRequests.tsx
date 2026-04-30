import { useState } from "react";
import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Check, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function PartRequests() {
  const { partRequests, products, suppliers, addPartRequest, approvePartRequest, rejectPartRequest, getStock, addPO } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [poRequestId, setPoRequestId] = useState<string | null>(null);

  const empty = { technician: "", jobRef: "", productId: "", requestedQty: 0, remarks: "" };
  const [form, setForm] = useState(empty);

  const [poForm, setPoForm] = useState({ supplierId: "", price: 0 });

  const activeRequest = poRequestId ? partRequests.find(r => r.id === poRequestId) : null;
  const activeProduct = activeRequest ? products.find(p => p.id === activeRequest.productId) : null;
  const remainingQty = activeRequest && activeProduct ? Math.max(0, activeRequest.requestedQty - getStock(activeProduct.id)) : 0;

  const submitRequest = () => {
    if (!form.technician || !form.productId || form.requestedQty <= 0) return;
    addPartRequest(form);
    toast.success("Part request submitted");
    setCreateOpen(false);
    setForm(empty);
  };

  const submitInlinePO = () => {
    if (!activeRequest || !activeProduct || !poForm.supplierId) return;
    const id = addPO({
      supplierId: poForm.supplierId,
      productId: activeProduct.id,
      qty: remainingQty,
      totalPrice: poForm.price * remainingQty,
      jobRef: activeRequest.jobRef,
    });
    toast.success(`${id} raised for ${remainingQty} units`);
    setPoRequestId(null);
    setPoForm({ supplierId: "", price: 0 });
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Pending: "bg-info-soft text-info",
      "Partially Available": "bg-warning-soft text-warning",
      Approved: "bg-success-soft text-success",
      Rejected: "bg-destructive/10 text-destructive",
    };
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s]}`}>{s}</span>;
  };

  return (
    <div>
      <PageHeader
        title="Part Requests"
        description="Technician part requests against active jobs. Approve from stock or raise inline POs."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Request</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Technician</th>
                <th className="px-4 py-3 font-medium">Job Ref</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Requested</th>
                <th className="px-4 py-3 font-medium text-right">Available</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...partRequests].reverse().map(r => {
                const prod = products.find(p => p.id === r.productId)!;
                const available = getStock(prod.id);
                const isPending = r.status === "Pending";
                const isPartial = r.status === "Partially Available";
                return (
                  <tr key={r.id} className="border-b last:border-0 table-row-hover">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.date}</td>
                    <td className="px-4 py-3 font-medium">{r.technician}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.jobRef}</td>
                    <td className="px-4 py-3">{prod.name}</td>
                    <td className="px-4 py-3 text-right">{r.requestedQty}</td>
                    <td className={`px-4 py-3 text-right ${available < r.requestedQty ? "text-warning" : ""}`}>{available}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.remarks}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {isPending && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => { approvePartRequest(r.id); toast.success("Approved"); }}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {isPartial && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => {
                            setPoRequestId(r.id);
                            setPoForm({ supplierId: "", price: prod.price });
                          }}>
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Raise PO
                          </Button>
                        )}
                        {(isPending || isPartial) && (
                          <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => { rejectPartRequest(r.id); toast("Rejected"); }}>
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        )}
                        {!isPending && !isPartial && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Request */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>New Part Request</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Technician Name</Label><Input className="mt-1.5" value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} /></div>
            <div><Label>Job Reference</Label><Input className="mt-1.5" value={form.jobRef} onChange={e => setForm({ ...form, jobRef: e.target.value })} placeholder="JOB-XXXX" /></div>
            <div>
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={v => setForm({ ...form, productId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} · Stock: {getStock(p.id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Requested Qty</Label><Input type="number" className="mt-1.5" value={form.requestedQty || ""} onChange={e => setForm({ ...form, requestedQty: +e.target.value })} /></div>
            <div><Label>Remarks</Label><Textarea className="mt-1.5" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
            <Button className="w-full" onClick={submitRequest}>Submit Request</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Inline Smart PO */}
      <Sheet open={!!poRequestId} onOpenChange={(o) => !o && setPoRequestId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Raise Smart PO</SheetTitle>
            <SheetDescription>Inline procurement to fulfill the shortage.</SheetDescription>
          </SheetHeader>
          {activeRequest && activeProduct && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{activeProduct.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{activeRequest.jobRef}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requested</span>
                  <span>{activeRequest.requestedQty}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">In Stock</span>
                  <span>{getStock(activeProduct.id)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Remaining Qty (to procure)</span>
                  <span className="font-semibold text-primary">{remainingQty}</span>
                </div>
              </div>

              <div>
                <Label>Product Name</Label>
                <Input className="mt-1.5" value={activeProduct.name} readOnly />
              </div>
              <div>
                <Label>Supplier</Label>
                <Select value={poForm.supplierId} onValueChange={v => setPoForm({ ...poForm, supplierId: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit Price (₹)</Label>
                <Input type="number" className="mt-1.5" value={poForm.price || ""} onChange={e => setPoForm({ ...poForm, price: +e.target.value })} />
              </div>
              <div className="rounded-lg border p-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">PO Total</span>
                <span className="font-semibold">₹{(poForm.price * remainingQty).toLocaleString("en-IN")}</span>
              </div>
              <Button className="w-full" onClick={submitInlinePO} disabled={!poForm.supplierId || poForm.price <= 0}>
                Submit PO · stay on screen
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
