import { useState, useMemo } from "react";
import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Receipt, FileText } from "lucide-react";

const customers = ["Rahul Sharma", "Priya Mehta", "Arvind Kapoor", "Neha Iyer", "Vikram Joshi"];

type InvoiceLine = {
  customer: string;
  jobRef: string;
  product: string;
  qty: number;
  price: number;
  total: number;
  branch: string;
  category: string;
  sku: string;
};

export default function Invoices() {
  const { branches, categories, products, usages } = useStore();

  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [skuId, setSkuId] = useState<string>("all");
  const [generated, setGenerated] = useState<InvoiceLine[] | null>(null);

  const toggleBranch = (id: string) => {
    setSelectedBranches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    setSelectAll(false);
  };
  const toggleSelectAll = () => {
    if (selectAll) { setSelectedBranches([]); setSelectAll(false); }
    else { setSelectedBranches(branches.map(b => b.id)); setSelectAll(true); }
  };

  // SKUs depend on category (and conceptually branch)
  const skuOptions = useMemo(() => {
    if (categoryId === "all") return products;
    return products.filter(p => p.categoryId === categoryId);
  }, [categoryId, products]);

  const generate = () => {
    // Build realistic invoice lines from actual usages
    const branchNames = selectedBranches.length ? branches.filter(b => selectedBranches.includes(b.id)).map(b => b.name) : branches.map(b => b.name);
    const lines: InvoiceLine[] = usages
      .filter(u => u.qty > 0)
      .filter(u => {
        const p = products.find(x => x.id === u.productId)!;
        if (categoryId !== "all" && p.categoryId !== categoryId) return false;
        if (skuId !== "all" && p.id !== skuId) return false;
        return true;
      })
      .map((u, i) => {
        const p = products.find(x => x.id === u.productId)!;
        const cat = categories.find(c => c.id === p.categoryId)!;
        return {
          customer: customers[i % customers.length],
          jobRef: u.jobRef || `JOB-10${20 + i}`,
          product: p.name,
          qty: u.qty,
          price: p.price,
          total: u.qty * p.price,
          branch: branchNames[i % branchNames.length],
          category: cat.name,
          sku: p.sku,
        };
      });
    setGenerated(lines);
  };

  const grandTotal = generated?.reduce((s, l) => s + l.total, 0) || 0;

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generate consolidated invoices using branch, date range, category and SKU filters."
      />

      <Card className="p-5 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Branch */}
          <div>
            <Label className="text-xs">Branch</Label>
            <div className="mt-1.5 rounded-md border p-3 max-h-48 overflow-y-auto space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox id="all-branches" checked={selectAll} onCheckedChange={toggleSelectAll} />
                <label htmlFor="all-branches" className="text-sm font-medium cursor-pointer">Select All</label>
              </div>
              {branches.map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <Checkbox id={b.id} checked={selectedBranches.includes(b.id)} onCheckedChange={() => toggleBranch(b.id)} />
                  <label htmlFor={b.id} className="text-sm cursor-pointer">{b.name}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" className="mt-1.5" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input type="date" className="mt-1.5" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSkuId("all"); }}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1.5">SKU options update based on selection.</p>
          </div>

          {/* SKU */}
          <div className="flex flex-col">
            <Label className="text-xs">SKU</Label>
            <Select value={skuId} onValueChange={setSkuId}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SKUs</SelectItem>
                {skuOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.sku} · {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="mt-auto w-full" onClick={generate}>
              <Receipt className="h-4 w-4 mr-1.5" /> Generate Invoice
            </Button>
          </div>
        </div>
      </Card>

      {generated && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b bg-[image:var(--gradient-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Invoice Preview</div>
                <div className="text-xs text-muted-foreground">
                  {generated.length} line items · {selectedBranches.length || branches.length} branch(es)
                  {startDate && ` · ${startDate} → ${endDate || "today"}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Grand Total</div>
              <div className="text-2xl font-semibold">₹{grandTotal.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Job Ref</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {generated.map((l, i) => (
                  <tr key={i} className="border-b last:border-0 table-row-hover">
                    <td className="px-4 py-3 font-medium">{l.customer}</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.jobRef}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{l.branch}</td>
                    <td className="px-4 py-3">{l.product}</td>
                    <td className="px-4 py-3"><code className="text-xs font-mono">{l.sku}</code></td>
                    <td className="px-4 py-3 text-right">{l.qty}</td>
                    <td className="px-4 py-3 text-right">₹{l.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{l.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40">
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-medium">Total</td>
                  <td className="px-4 py-3 text-right font-semibold">₹{grandTotal.toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
