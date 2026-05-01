import { useMemo, useState } from "react";
import { Search, Boxes, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InfoTip } from "@/components/InfoTip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Product } from "@/store/inventory";
import { cn } from "@/lib/utils";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

const statusFor = (stock: number, min: number): StockStatus => {
  if (stock <= 0) return "Out of Stock";
  if (stock <= min) return "Low Stock";
  return "In Stock";
};

const statusBadge = (s: StockStatus) => {
  if (s === "In Stock")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (s === "Low Stock")
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
};

export default function Stock() {
  const { products, categories, pos, partRequests, getStock, getReceived, getUsed, getAdjustment } = useStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [oemFilter, setOemFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Product | null>(null);

  const oems = useMemo(
    () => Array.from(new Set(products.map(p => p.oem))).sort(),
    [products]
  );

  // Reserved = sum of qty for approved part requests per product
  const reservedByProduct = useMemo(() => {
    const map = new Map<string, number>();
    partRequests
      .filter(r => r.status === "Approved")
      .forEach(r => map.set(r.productId, (map.get(r.productId) || 0) + r.requestedQty));
    return map;
  }, [partRequests]);

  // Last updated = most recent delivery date for product across POs
  const lastUpdatedByProduct = useMemo(() => {
    const map = new Map<string, string>();
    pos.forEach(po => {
      po.items.forEach(it => {
        it.deliveries.forEach(d => {
          const prev = map.get(it.productId);
          if (!prev || d.date > prev) map.set(it.productId, d.date);
        });
      });
    });
    return map;
  }, [pos]);

  const rows = useMemo(() => {
    return products.map(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      const stock = getStock(p.id);
      const status = statusFor(stock, p.minStock);
      return {
        product: p,
        categoryName: cat?.name || "—",
        stock,
        reserved: reservedByProduct.get(p.id) || 0,
        status,
        lastUpdated: lastUpdatedByProduct.get(p.id) || "—",
      };
    });
  }, [products, categories, getStock, reservedByProduct, lastUpdatedByProduct]);

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (q && !r.product.name.toLowerCase().includes(q) && !r.product.sku.toLowerCase().includes(q)) return false;
    if (categoryFilter !== "all" && r.product.categoryId !== categoryFilter) return false;
    if (oemFilter !== "all" && r.product.oem !== oemFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const summary = useMemo(() => {
    let inStock = 0, low = 0, out = 0;
    rows.forEach(r => {
      if (r.status === "In Stock") inStock++;
      else if (r.status === "Low Stock") low++;
      else out++;
    });
    return { inStock, low, out, total: rows.length };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Real-time inventory visibility across all products"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPI icon={<Boxes className="h-4 w-4" />} label="Total SKUs" value={summary.total} tone="primary" />
        <KPI icon={<CheckCircle2 className="h-4 w-4" />} label="In Stock" value={summary.inStock} tone="emerald" />
        <KPI icon={<AlertTriangle className="h-4 w-4" />} label="Low Stock" value={summary.low} tone="amber" />
        <KPI icon={<XCircle className="h-4 w-4" />} label="Out of Stock" value={summary.out} tone="rose" />
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by product or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={oemFilter} onValueChange={setOemFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="OEM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OEMs</SelectItem>
              {oems.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Stock Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>OEM</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex items-center gap-1">
                  Reserved
                  <InfoTip>Quantity locked by approved part requests.</InfoTip>
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex items-center gap-1">
                  Min Level
                  <InfoTip>Reorder threshold per product.</InfoTip>
                </span>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => {
              const isLow = r.status === "Low Stock" || r.status === "Out of Stock";
              return (
                <TableRow
                  key={r.product.id}
                  onClick={() => setSelected(r.product)}
                  className={cn("cursor-pointer", isLow && "bg-amber-50/40 hover:bg-amber-50/70")}
                >
                  <TableCell className="font-medium">{r.product.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.product.sku}</TableCell>
                  <TableCell>{r.product.oem}</TableCell>
                  <TableCell>{r.categoryName}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{r.stock}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.reserved}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.product.minStock}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", statusBadge(r.status))}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.lastUpdated}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No products match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (() => {
            const cat = categories.find(c => c.id === selected.categoryId);
            const received = getReceived(selected.id);
            const used = getUsed(selected.id);
            const adj = getAdjustment(selected.id);
            const stock = getStock(selected.id);
            const status = statusFor(stock, selected.minStock);
            const reserved = reservedByProduct.get(selected.id) || 0;
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{selected.name}</SheetTitle>
                  <SheetDescription className="font-mono text-xs">{selected.sku}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Meta label="OEM" value={selected.oem} />
                    <Meta label="Category" value={cat?.name || "—"} />
                    <Meta label="Unit" value={selected.unit} />
                    <Meta label="Price" value={`₹ ${selected.price.toLocaleString()}`} />
                  </div>

                  <div className="rounded-md border divide-y">
                    <Row label="Total Received" value={received} />
                    <Row label="Total Used" value={used} />
                    <Row label="Total Adjustments" value={adj} muted={adj === 0} />
                    <Row label="Reserved" value={reserved} muted={reserved === 0} />
                    <Row label="Minimum Level" value={selected.minStock} />
                    <div className="flex items-center justify-between p-3 bg-muted/30">
                      <div className="text-sm font-medium inline-flex items-center gap-1">
                        Current Stock
                        <InfoTip>Available = Received − Used + Adjustments</InfoTip>
                      </div>
                      <div className="text-lg font-semibold tabular-nums">{stock}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", statusBadge(status))}>
                      {status}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KPI({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "emerald" | "amber" | "rose" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", tones[tone])}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-medium tabular-nums", muted && "text-muted-foreground")}>{value}</div>
    </div>
  );
}
