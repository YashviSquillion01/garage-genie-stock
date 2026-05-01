import { useState } from "react";
import { useStore, generateSku } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Search } from "lucide-react";

export default function Products() {
  const { products, categories, addProduct, updateProduct, getStock } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  const empty = { name: "", oem: "", categoryId: "", unit: "Piece", price: 0, minStock: 0 };
  const [form, setForm] = useState(empty);

  const previewSku = form.name && form.oem && form.categoryId
    ? generateSku(form.name, form.oem, categories.find(c => c.id === form.categoryId)?.code || "", products.filter(p => p.id !== editingId))
    : "";

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.oem.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  const startAdd = () => { setEditingId(null); setForm(empty); setOpen(true); };
  const startEdit = (id: string) => {
    const p = products.find(x => x.id === id)!;
    setEditingId(id);
    setForm({ name: p.name, oem: p.oem, categoryId: p.categoryId, unit: p.unit, price: p.price, minStock: p.minStock });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name || !form.categoryId) return;
    if (editingId) updateProduct(editingId, form);
    else addProduct(form);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Master catalog of every part and consumable. SKUs are auto-generated."
        action={<Button onClick={startAdd}><Plus className="h-4 w-4 mr-1" /> New Product</Button>}
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, SKU, OEM…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} products</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">OEM</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Min</th>
                <th className="px-4 py-3 font-medium text-right w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                const stock = getStock(p.id);
                return (
                  <tr key={p.id} className="border-b last:border-0 table-row-hover">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.oem}</td>
                    <td className="px-4 py-3">{cat?.name}</td>
                    <td className="px-4 py-3"><code className="text-xs font-mono px-2 py-0.5 rounded bg-muted">{p.sku}</code></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                    <td className="px-4 py-3 text-right">₹{p.price.toLocaleString("en-IN")}</td>
                    <td className={`px-4 py-3 text-right font-medium ${stock <= p.minStock ? "text-warning" : ""}`}>{stock}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.minStock}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p.id)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
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
            <SheetTitle>{editingId ? "Edit Product" : "New Product"}</SheetTitle>
            <SheetDescription>Fill in the details — SKU is generated automatically.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Castrol GTX 5W-30" />
            </div>
            <div>
              <Label>OEM</Label>
              <Input className="mt-1.5" value={form.oem} onChange={e => setForm({ ...form, oem: e.target.value })} placeholder="e.g. Castrol" />
            </div>
            <div>
              <Label>Category Name</Label>
              <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SKU</Label>
              <Input className="mt-1.5 font-mono" value={editingId ? products.find(p => p.id === editingId)!.sku : previewSku} readOnly placeholder="Auto-generated" />
              <p className="text-xs text-muted-foreground mt-1.5">Auto-generated from category code + sequence.</p>
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Piece">Piece</SelectItem>
                  <SelectItem value="Litre">Litre</SelectItem>
                  <SelectItem value="Set">Set</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Metre">Metre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" className="mt-1.5" value={form.price || ""} onChange={e => setForm({ ...form, price: +e.target.value })} />
            </div>
            <div>
              <Label>Minimum Stock Level</Label>
              <Input type="number" className="mt-1.5" value={form.minStock || ""} onChange={e => setForm({ ...form, minStock: +e.target.value })} />
            </div>
            <Button className="w-full" onClick={submit} disabled={!form.name || !form.categoryId}>
              {editingId ? "Save changes" : "Create product"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
