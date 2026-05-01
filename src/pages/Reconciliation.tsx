import { useState } from "react";
import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function Reconciliation() {
  const { pos, products, suppliers, reconciliations, getStock, getUsed, getReceived, addReconciliation } = useStore();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [physical, setPhysical] = useState<number | "">("");

  // Build single-table view: one row per PO line item
  const rows = pos.flatMap(po => {
    const sup = suppliers.find(s => s.id === po.supplierId)!;
    return po.items.map(it => {
      const prod = products.find(p => p.id === it.productId)!;
      const productStock = getStock(prod.id);
      const productUsed = getUsed(prod.id);
      const productReceived = getReceived(prod.id);
      const lastRecon = [...reconciliations].reverse().find(r => r.productId === prod.id);
      return {
        key: `${po.id}-${prod.id}`,
        poId: po.id,
        supplier: sup.name,
        product: prod.name,
        productId: prod.id,
        ordered: it.qty,
        received: it.receivedQty,
        productReceived,
        used: productUsed,
        stock: productStock,
        lastRecon,
      };
    });
  }).sort((a, b) => b.poId.localeCompare(a.poId));

  const systemStock = productId ? getStock(productId) : 0;
  const diff = physical === "" ? 0 : (Number(physical) - systemStock);

  const submit = () => {
    if (!productId || physical === "") return;
    addReconciliation(productId, Number(physical));
    toast.success("Reconciliation recorded");
    setOpen(false);
    setProductId(""); setPhysical("");
  };

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Reconcile system stock against physical counts. Adjustments flow back into stock."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Reconciliation</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                <th className="px-4 py-3 font-medium">PO ID</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Ordered Qty</th>
                <th className="px-4 py-3 font-medium text-right">Received Qty</th>
                <th className="px-4 py-3 font-medium text-right">Used Qty</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const mismatch = r.lastRecon && r.lastRecon.difference !== 0;
                return (
                  <tr key={r.key} className="border-b last:border-0 table-row-hover">
                    <td className="px-4 py-3 font-mono text-xs">{r.poId}</td>
                    <td className="px-4 py-3">{r.supplier}</td>
                    <td className="px-4 py-3 font-medium">{r.product}</td>
                    <td className="px-4 py-3 text-right">{r.ordered}</td>
                    <td className="px-4 py-3 text-right">{r.received}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.used}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span className="font-medium">{r.stock}</span>
                        {mismatch && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-warning"><AlertCircle className="h-3.5 w-3.5" /></button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              <div className="space-y-1">
                                <div className="font-semibold">Stock Adjusted</div>
                                <div>System Stock: <span className="font-mono">{r.lastRecon!.systemStock}</span></div>
                                <div>Physical Stock: <span className="font-mono">{r.lastRecon!.physicalStock}</span></div>
                                <div>Difference: <span className={`font-mono ${r.lastRecon!.difference < 0 ? "text-destructive" : "text-success"}`}>
                                  {r.lastRecon!.difference > 0 ? "+" : ""}{r.lastRecon!.difference}
                                </span></div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Reconciliation</SheetTitle>
            <SheetDescription>Compare system stock with the actual count from the store.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Item Name</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} · {p.sku}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>System Stock</Label>
              <Input className="mt-1.5" value={productId ? systemStock : ""} readOnly placeholder="Auto" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                Physical Stock
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground"><Info className="h-3.5 w-3.5" /></button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">
                    Physical Stock means actual manually counted stock in store.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input type="number" className="mt-1.5" value={physical} onChange={e => setPhysical(e.target.value === "" ? "" : +e.target.value)} placeholder="Enter counted quantity" />
            </div>
            <div>
              <Label>Difference</Label>
              <Input
                className={`mt-1.5 font-mono ${diff < 0 ? "text-destructive" : diff > 0 ? "text-success" : ""}`}
                value={productId && physical !== "" ? (diff > 0 ? `+${diff}` : diff) : ""}
                readOnly
                placeholder="Auto-calculated"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Difference = Physical − System</p>
            </div>
            <Button className="w-full" onClick={submit} disabled={!productId || physical === ""}>
              Save Reconciliation
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
