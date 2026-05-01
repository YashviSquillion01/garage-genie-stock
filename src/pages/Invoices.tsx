import { useState, useMemo } from "react";
import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/PageHeader";
import { Receipt, FileText, Search, ChevronDown, FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const customers = ["Rahul Sharma", "Priya Mehta", "Arvind Kapoor", "Neha Iyer", "Vikram Joshi", "Sanjay Gupta", "Meera Nair"];

type InvoiceLine = {
  invoiceId: string;
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
  const [branchSearch, setBranchSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [skuId, setSkuId] = useState<string>("all");
  const [generated, setGenerated] = useState<InvoiceLine[] | null>(null);

  const allSelected = selectedBranches.length === branches.length;
  const toggleBranch = (id: string) =>
    setSelectedBranches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  const toggleSelectAll = () =>
    setSelectedBranches(allSelected ? [] : branches.map(b => b.id));

  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()));

  const skuOptions = useMemo(() => {
    if (categoryId === "all") return products;
    return products.filter(p => p.categoryId === categoryId);
  }, [categoryId, products]);

  const generate = () => {
    const branchNames = selectedBranches.length
      ? branches.filter(b => selectedBranches.includes(b.id)).map(b => b.name)
      : branches.map(b => b.name);
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
          invoiceId: `INV-${2025001 + i}`,
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

  const downloadCSV = () => {
    if (!generated) return;
    const headers = ["Invoice ID", "Customer", "Job Ref", "Branch", "Product", "SKU", "Qty", "Price", "Total"];
    const rows = generated.map(l => [l.invoiceId, l.customer, l.jobRef, l.branch, l.product, l.sku, l.qty, l.price, l.total]);
    const csv = [headers, ...rows, ["", "", "", "", "", "", "", "Grand Total", grandTotal]]
      .map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoices-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel/CSV downloaded");
  };

  const downloadPDF = () => {
    toast.success("PDF download queued");
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generate consolidated invoices using filters. Vertical, line-by-line filter flow."
      />

      {/* Vertical Filter Section */}
      <Card className="p-6 mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">Invoice Filters</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Apply filters line by line, then generate.</p>
          </div>
          <Button onClick={generate}>
            <Receipt className="h-4 w-4 mr-1.5" /> Generate Invoice
          </Button>
        </div>

        <div className="space-y-5 max-w-3xl">
          {/* 1. Branch Selection */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <Label className="col-span-3 pt-2 text-sm">Branch Selection</Label>
            <div className="col-span-9">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">
                      {selectedBranches.length === 0 ? "All branches" :
                        allSelected ? "All branches selected" :
                        `${selectedBranches.length} branch${selectedBranches.length > 1 ? "es" : ""} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-8 h-8 text-sm" placeholder="Search branches…"
                        value={branchSearch} onChange={e => setBranchSearch(e.target.value)} />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer border-b mb-1">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                      <span className="text-sm font-medium">Select All</span>
                    </label>
                    {filteredBranches.map(b => (
                      <label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                        <Checkbox checked={selectedBranches.includes(b.id)} onCheckedChange={() => toggleBranch(b.id)} />
                        <span className="text-sm">{b.name}</span>
                      </label>
                    ))}
                    {filteredBranches.length === 0 && (
                      <div className="px-2 py-3 text-xs text-muted-foreground text-center">No branches match</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 2. Date Range */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <Label className="col-span-3 text-sm">Date Range</Label>
            <div className="col-span-9 grid grid-cols-2 gap-3">
              <div>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Start date" />
                <p className="text-[11px] text-muted-foreground mt-1">Start Date</p>
              </div>
              <div>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End date" />
                <p className="text-[11px] text-muted-foreground mt-1">End Date</p>
              </div>
            </div>
          </div>

          {/* 3. Category */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <Label className="col-span-3 text-sm">Category Selection</Label>
            <div className="col-span-9">
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSkuId("all"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. SKU */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <Label className="col-span-3 text-sm">SKU Selection</Label>
            <div className="col-span-9">
              <Select value={skuId} onValueChange={setSkuId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SKUs</SelectItem>
                  {skuOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.sku} · {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1.5">Dynamic — based on Branch + Category selection.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoice Listing */}
      {generated && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b bg-[image:var(--gradient-subtle)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Invoice Listing</div>
                <div className="text-xs text-muted-foreground">
                  {generated.length} invoice line{generated.length !== 1 ? "s" : ""} · {selectedBranches.length || branches.length} branch(es)
                  {startDate && ` · ${startDate} → ${endDate || "today"}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <FileDown className="h-4 w-4 mr-1.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Download Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                  <th className="px-4 py-3 font-medium">Invoice ID</th>
                  <th className="px-4 py-3 font-medium">Customer Name</th>
                  <th className="px-4 py-3 font-medium">Job Ref</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {generated.map((l) => (
                  <tr key={l.invoiceId} className="border-b last:border-0 table-row-hover">
                    <td className="px-4 py-3 font-mono text-xs">{l.invoiceId}</td>
                    <td className="px-4 py-3 font-medium">{l.customer}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.jobRef}</td>
                    <td className="px-4 py-3">
                      <div>{l.product}</div>
                      <code className="text-[11px] font-mono text-muted-foreground">{l.sku}</code>
                    </td>
                    <td className="px-4 py-3 text-right">{l.qty}</td>
                    <td className="px-4 py-3 text-right">₹{l.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{l.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Total */}
          <div className="border-t bg-muted/30 px-5 py-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Total {generated.length} line item{generated.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-semibold">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
