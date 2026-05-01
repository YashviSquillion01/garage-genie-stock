import { create } from "zustand";

export type Category = { id: string; name: string; code: string };
export type Product = {
  id: string;
  name: string;
  oem: string;
  categoryId: string;
  sku: string;
  unit: string;
  price: number;
  minStock: number;
};
export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
};
export type DeliveryEntry = { qty: number; price: number; date: string };
export type POItem = {
  productId: string;
  qty: number;
  price: number;
  receivedQty: number;
  deliveries: DeliveryEntry[];
};
export type PurchaseOrder = {
  id: string;
  supplierId: string;
  items: POItem[];
  status: "Pending" | "Partial" | "Delivered";
  date: string;
  jobRef?: string;
};
export type Reconciliation = {
  id: string;
  productId: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  date: string;
};
export type PartRequest = {
  id: string;
  date: string;
  technician: string;
  jobRef: string;
  productId: string;
  requestedQty: number;
  remarks: string;
  status: "Pending" | "Partially Available" | "Approved" | "Rejected";
};
export type Branch = { id: string; name: string };
export type Usage = { productId: string; qty: number; jobRef: string };

type Store = {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  pos: PurchaseOrder[];
  reconciliations: Reconciliation[];
  partRequests: PartRequest[];
  branches: Branch[];
  usages: Usage[];

  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;

  addProduct: (p: Omit<Product, "id" | "sku">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;

  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;

  addPO: (po: { supplierId: string; items: Omit<POItem, "receivedQty" | "deliveries">[]; jobRef?: string }) => string;
  recordDelivery: (poId: string, productId: string, qty: number, price: number, date: string) => void;

  addReconciliation: (productId: string, physical: number) => void;

  approvePartRequest: (id: string) => void;
  rejectPartRequest: (id: string) => void;

  getStock: (productId: string) => number;
  getUsed: (productId: string) => number;
  getReceived: (productId: string) => number;
  getAdjustment: (productId: string) => number;
};

const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const generateCategoryCode = (name: string, existing: Category[]): string => {
  const words = name.trim().toUpperCase().split(/\s+/);
  let code = words.length >= 2 ? words.map(w => w[0]).join("").slice(0, 3) : words[0].slice(0, 3);
  code = code.replace(/[^A-Z]/g, "");
  let final = code;
  let i = 1;
  while (existing.some(c => c.code === final)) {
    final = (code.slice(0, 2) + i).slice(0, 3);
    i++;
  }
  return final;
};

const productShortCode = (productName: string): string => {
  const clean = productName.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
  const first = clean.split(/\s+/)[0] || "";
  return first.slice(0, 3).padEnd(3, "X");
};

const oemPrefix = (oem: string): string => {
  const clean = (oem || "OEM").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.slice(0, 4) || "OEM";
};

export const generateSku = (productName: string, oem: string, categoryCode: string, existing: Product[]): string => {
  const op = oemPrefix(oem);
  const cc = (categoryCode || "GEN").toUpperCase();
  const pc = productShortCode(productName);
  const prefix = `${op}-${cc}-${pc}`;
  const count = existing.filter(p => p.sku.startsWith(prefix + "-")).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
};

// ---- Seed data ----
const seedCategories: Category[] = [
  { id: "c1", name: "Engine Oil", code: "EO" },
  { id: "c2", name: "Tyres", code: "TY" },
  { id: "c3", name: "Brake System", code: "BS" },
  { id: "c4", name: "Filters", code: "FL" },
  { id: "c5", name: "Battery", code: "BT" },
  { id: "c6", name: "Spark Plugs", code: "SP" },
];

const seedProducts: Product[] = [
  { id: "p1", name: "GTX 5W-30", oem: "Castrol", categoryId: "c1", sku: "CAST-EO-GTX-001", unit: "Litre", price: 650, minStock: 20 },
  { id: "p2", name: "Mobil 10W-40", oem: "ExxonMobil", categoryId: "c1", sku: "EXXO-EO-MOB-001", unit: "Litre", price: 820, minStock: 15 },
  { id: "p3", name: "ZVTS 165/80 R14", oem: "MRF", categoryId: "c2", sku: "MRF-TY-ZVT-001", unit: "Piece", price: 4500, minStock: 8 },
  { id: "p4", name: "Amazer 4G 175/65 R15", oem: "Apollo", categoryId: "c2", sku: "APOL-TY-AMA-001", unit: "Piece", price: 5200, minStock: 6 },
  { id: "p5", name: "Brake Pad Set", oem: "Bosch", categoryId: "c3", sku: "BOSC-BS-BRA-001", unit: "Set", price: 1850, minStock: 10 },
  { id: "p6", name: "Brake Disc Front", oem: "TVS", categoryId: "c3", sku: "TVS-BS-BRA-001", unit: "Piece", price: 2400, minStock: 5 },
  { id: "p7", name: "Air Filter", oem: "K&N", categoryId: "c4", sku: "KN-FL-AIR-001", unit: "Piece", price: 950, minStock: 12 },
  { id: "p8", name: "Oil Filter", oem: "Mann", categoryId: "c4", sku: "MANN-FL-OIL-001", unit: "Piece", price: 320, minStock: 25 },
  { id: "p9", name: "Mileage 12V 65Ah", oem: "Exide", categoryId: "c5", sku: "EXID-BT-MIL-001", unit: "Piece", price: 6200, minStock: 4 },
  { id: "p10", name: "Iridium Spark Plug", oem: "NGK", categoryId: "c6", sku: "NGK-SP-IRI-001", unit: "Piece", price: 480, minStock: 30 },
];

const seedSuppliers: Supplier[] = [
  { id: "s1", name: "AutoParts Hub Pvt Ltd", contact: "Rajesh Kumar", phone: "+91 98765 43210", email: "rajesh@autopartshub.in", gstin: "27AABCA1234L1ZX", address: "Plot 14, MIDC, Pune 411019" },
  { id: "s2", name: "Premier Lubricants", contact: "Anita Mehta", phone: "+91 99887 76655", email: "sales@premierlubes.com", gstin: "29AAACP9876R1Z2", address: "JP Nagar, Bengaluru 560078" },
  { id: "s3", name: "Tyre World Distributors", contact: "Mohammed Iqbal", phone: "+91 90909 12345", email: "iqbal@tyreworld.in", gstin: "33AAACT4567Q1ZP", address: "GST Road, Chennai 600045" },
  { id: "s4", name: "Bosch Auto Spares", contact: "Sunita Rao", phone: "+91 88776 65544", email: "spares@boschauto.in", gstin: "07AAACB1122E1ZN", address: "Okhla Phase II, New Delhi 110020" },
];

const today = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const seedPOs: PurchaseOrder[] = [
  {
    id: "PO-1001", supplierId: "s2", date: today(-15), status: "Delivered",
    items: [
      { productId: "p1", qty: 50, price: 650, receivedQty: 50, deliveries: [{ qty: 50, price: 32500, date: today(-12) }] },
      { productId: "p2", qty: 20, price: 820, receivedQty: 20, deliveries: [{ qty: 20, price: 16400, date: today(-12) }] },
    ],
  },
  {
    id: "PO-1002", supplierId: "s3", date: today(-10), status: "Partial",
    items: [
      { productId: "p3", qty: 20, price: 4500, receivedQty: 12, deliveries: [{ qty: 12, price: 54000, date: today(-7) }] },
      { productId: "p4", qty: 10, price: 5200, receivedQty: 4, deliveries: [{ qty: 4, price: 20800, date: today(-7) }] },
    ],
  },
  {
    id: "PO-1003", supplierId: "s4", date: today(-8), status: "Delivered",
    items: [
      { productId: "p5", qty: 30, price: 1850, receivedQty: 30, deliveries: [{ qty: 30, price: 55500, date: today(-5) }] },
      { productId: "p6", qty: 8, price: 2400, receivedQty: 8, deliveries: [{ qty: 8, price: 19200, date: today(-5) }] },
    ],
  },
  {
    id: "PO-1004", supplierId: "s1", date: today(-2), status: "Pending",
    items: [
      { productId: "p7", qty: 25, price: 950, receivedQty: 0, deliveries: [] },
      { productId: "p8", qty: 40, price: 320, receivedQty: 0, deliveries: [] },
    ],
  },
  {
    id: "PO-1005", supplierId: "s4", date: today(-4), status: "Delivered",
    items: [
      { productId: "p9", qty: 10, price: 6200, receivedQty: 10, deliveries: [{ qty: 10, price: 62000, date: today(-1) }] },
      { productId: "p10", qty: 30, price: 480, receivedQty: 30, deliveries: [{ qty: 30, price: 14400, date: today(-1) }] },
    ],
  },
];

const seedUsages: Usage[] = [
  { productId: "p1", qty: 18, jobRef: "JOB-1019" },
  { productId: "p3", qty: 4, jobRef: "JOB-1021" },
  { productId: "p5", qty: 12, jobRef: "JOB-1023" },
  { productId: "p2", qty: 6, jobRef: "JOB-1024" },
  { productId: "p9", qty: 2, jobRef: "JOB-1025" },
  { productId: "p10", qty: 14, jobRef: "JOB-1020" },
  { productId: "p8", qty: 9, jobRef: "JOB-1022" },
];

const seedReconciliations: Reconciliation[] = [
  { id: "RC-001", productId: "p3", systemStock: 8, physicalStock: 7, difference: -1, date: today(-2) },
  { id: "RC-002", productId: "p10", systemStock: 16, physicalStock: 16, difference: 0, date: today(-1) },
];

const seedRequests: PartRequest[] = [
  { id: "PR-001", date: today(-1), technician: "Vikram Singh", jobRef: "JOB-1026", productId: "p5", requestedQty: 2, remarks: "Front brake replacement", status: "Pending" },
  { id: "PR-002", date: today(-1), technician: "Arjun Patel", jobRef: "JOB-1027", productId: "p3", requestedQty: 6, remarks: "Customer requested 4 tyres + 2 spare", status: "Partially Available" },
  { id: "PR-003", date: today(0), technician: "Ramesh Yadav", jobRef: "JOB-1028", productId: "p1", requestedQty: 4, remarks: "Oil change service", status: "Pending" },
  { id: "PR-004", date: today(0), technician: "Suresh Naidu", jobRef: "JOB-1029", productId: "p9", requestedQty: 1, remarks: "Battery replacement", status: "Approved" },
  { id: "PR-005", date: today(0), technician: "Kiran Joshi", jobRef: "JOB-1030", productId: "p4", requestedQty: 5, remarks: "Set of front + rear", status: "Partially Available" },
];

const seedBranches: Branch[] = [
  { id: "b1", name: "Pune — Kothrud" },
  { id: "b2", name: "Mumbai — Andheri" },
  { id: "b3", name: "Bengaluru — Whitefield" },
  { id: "b4", name: "Chennai — OMR" },
];

const computeStatus = (items: POItem[]): PurchaseOrder["status"] => {
  const totalOrdered = items.reduce((s, i) => s + i.qty, 0);
  const totalReceived = items.reduce((s, i) => s + i.receivedQty, 0);
  if (totalReceived === 0) return "Pending";
  if (totalReceived >= totalOrdered) return "Delivered";
  return "Partial";
};

export const useStore = create<Store>((set, get) => ({
  categories: seedCategories,
  products: seedProducts,
  suppliers: seedSuppliers,
  pos: seedPOs,
  reconciliations: seedReconciliations,
  partRequests: seedRequests,
  branches: seedBranches,
  usages: seedUsages,

  addCategory: (name) => set((s) => ({
    categories: [...s.categories, { id: genId("c"), name, code: generateCategoryCode(name, s.categories) }],
  })),
  updateCategory: (id, name) => set((s) => ({
    categories: s.categories.map(c => c.id === id ? { ...c, name, code: generateCategoryCode(name, s.categories.filter(x => x.id !== id)) } : c),
  })),

  addProduct: (p) => set((s) => {
    const cat = s.categories.find(c => c.id === p.categoryId);
    const sku = generateSku(p.name, p.oem, cat?.code || "", s.products);
    return { products: [...s.products, { ...p, id: genId("p"), sku }] };
  }),
  updateProduct: (id, p) => set((s) => ({
    products: s.products.map(x => x.id === id ? { ...x, ...p } : x),
  })),

  addSupplier: (sup) => set((s) => ({ suppliers: [...s.suppliers, { ...sup, id: genId("s") }] })),
  updateSupplier: (id, sup) => set((s) => ({
    suppliers: s.suppliers.map(x => x.id === id ? { ...x, ...sup } : x),
  })),

  addPO: ({ supplierId, items, jobRef }) => {
    const id = `PO-${1000 + get().pos.length + 10}`;
    const newItems: POItem[] = items.map(i => ({ ...i, receivedQty: 0, deliveries: [] }));
    set((s) => ({
      pos: [...s.pos, { id, supplierId, items: newItems, status: "Pending", date: today(0), jobRef }],
    }));
    return id;
  },
  recordDelivery: (poId, productId, qty, price, date) => set((s) => ({
    pos: s.pos.map(po => {
      if (po.id !== poId) return po;
      const newItems = po.items.map(it => {
        if (it.productId !== productId) return it;
        return {
          ...it,
          receivedQty: it.receivedQty + qty,
          deliveries: [...it.deliveries, { qty, price, date }],
        };
      });
      return { ...po, items: newItems, status: computeStatus(newItems) };
    }),
  })),

  addReconciliation: (productId, physical) => {
    const sys = get().getStock(productId);
    set((s) => ({
      reconciliations: [
        ...s.reconciliations,
        { id: `RC-${String(s.reconciliations.length + 1).padStart(3, "0")}`, productId, systemStock: sys, physicalStock: physical, difference: physical - sys, date: today(0) },
      ],
    }));
  },

  approvePartRequest: (id) => set((s) => {
    const r = s.partRequests.find(x => x.id === id);
    if (!r) return s;
    return {
      partRequests: s.partRequests.map(x => x.id === id ? { ...x, status: "Approved" as const } : x),
      usages: [...s.usages, { productId: r.productId, qty: r.requestedQty, jobRef: r.jobRef }],
    };
  }),
  rejectPartRequest: (id) => set((s) => ({
    partRequests: s.partRequests.map(r => r.id === id ? { ...r, status: "Rejected" } : r),
  })),

  getReceived: (productId) => get().pos
    .flatMap(po => po.items)
    .filter(it => it.productId === productId)
    .reduce((sum, it) => sum + it.receivedQty, 0),
  getUsed: (productId) => get().usages
    .filter(u => u.productId === productId)
    .reduce((sum, u) => sum + u.qty, 0),
  getAdjustment: (productId) => {
    const recs = get().reconciliations.filter(r => r.productId === productId);
    if (recs.length === 0) return 0;
    return recs.reduce((sum, r) => sum + r.difference, 0);
  },
  getStock: (productId) => {
    return get().getReceived(productId) - get().getUsed(productId) + get().getAdjustment(productId);
  },
}));
