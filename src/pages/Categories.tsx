import { useState } from "react";
import { useStore, generateCategoryCode } from "@/store/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Search } from "lucide-react";

export default function Categories() {
  const { categories, addCategory, updateCategory } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const previewCode = name ? generateCategoryCode(name, categories.filter(c => c.id !== editingId)) : "";

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const startAdd = () => { setEditingId(null); setName(""); setOpen(true); };
  const startEdit = (id: string, n: string) => { setEditingId(id); setName(n); setOpen(true); };

  const submit = () => {
    if (!name.trim()) return;
    if (editingId) updateCategory(editingId, name.trim());
    else addCategory(name.trim());
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group products under category families. Codes auto-generate from the name."
        action={<Button onClick={startAdd}><Plus className="h-4 w-4 mr-1" /> New Category</Button>}
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or code…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {categories.length}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium w-32 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 table-row-hover">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{c.code}</code>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(c.id, c.name)}>
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Category" : "New Category"}</SheetTitle>
            <SheetDescription>Code is generated automatically from the name.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Name</Label>
              <Input className="mt-1.5" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engine Oil" />
            </div>
            <div>
              <Label>Code</Label>
              <Input className="mt-1.5 font-mono" value={previewCode} readOnly placeholder="Auto-generated" />
              <p className="text-xs text-muted-foreground mt-1.5">Auto-generated · Max 3 chars · Uppercase</p>
            </div>
            <Button className="w-full" onClick={submit} disabled={!name.trim()}>
              {editingId ? "Save changes" : "Create category"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
