import { useState } from "react";
import { useStore } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Search } from "lucide-react";

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const empty = { name: "", contact: "", phone: "", email: "", gstin: "", address: "" };
  const [form, setForm] = useState(empty);

  const filtered = suppliers.filter(s =>
    [s.name, s.contact, s.phone, s.gstin].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const startAdd = () => { setEditingId(null); setForm(empty); setOpen(true); };
  const startEdit = (id: string) => {
    const s = suppliers.find(x => x.id === id)!;
    setEditingId(id);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, gstin: s.gstin, address: s.address });
    setOpen(true);
  };
  const submit = () => {
    if (!form.name) return;
    if (editingId) updateSupplier(editingId, form);
    else addSupplier(form);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Vendor directory for procurement."
        action={<Button onClick={startAdd}><Plus className="h-4 w-4 mr-1" /> New Supplier</Button>}
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} suppliers</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Contact Person</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">GSTIN</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium text-right w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 table-row-hover">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.contact}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                  <td className="px-4 py-3"><code className="text-xs font-mono">{s.gstin}</code></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[260px] truncate">{s.address}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(s.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Supplier" : "New Supplier"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Supplier Name</Label><Input className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Contact Person</Label><Input className="mt-1.5" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
            <div><Label>Phone</Label><Input className="mt-1.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input className="mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>GSTIN</Label><Input className="mt-1.5 font-mono" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} /></div>
            <div><Label>Address</Label><Input className="mt-1.5" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <Button className="w-full" onClick={submit} disabled={!form.name}>
              {editingId ? "Save changes" : "Create supplier"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
