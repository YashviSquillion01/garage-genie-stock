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
export type PurchaseOrder = {
  id: string;
  supplierId: string;
  productId: string;
  qty: number;
  totalPrice: number;
  status: "Pending" | "Partial" | "Delivered";
  receivedQty: number;
  deliveries: DeliveryEntry[];
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

  addPO: (po: Omit<PurchaseOrder, "id" | "status" | "receivedQty" | "deliveries" | "date">) => string;
  recordDelivery: (poId: string, qty: number, price: number) => void;

  addReconciliation: (productId: string, physical: number) => void;

  addPartRequest: (r: Omit<PartRequest, "id" | "status" | "date">) => void;
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

export const generateSku = (productName: string, categoryCode: string, existing: Product[]): string => {
  const prefix = categoryCode || productName.slice(0, 2).toUpperCase();
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
  { id: "p1", name: "Castrol GTX 5W-30", oem: "Castrol", categoryId: "c1", sku: "EO-001", unit: "Litre", price: 650, minStock: 20 },
  { id: "p2", name: "Mobil 1 10W-40", oem: "ExxonMobil", categoryId: "c1", sku: "EO-002", unit: "Litre", price: 820, minStock: 15 },
  { id: "p3", name: "MRF ZVTS 165/80 R14", oem: "MRF", categoryId: "c2", sku: "TY-001", unit: "Piece", price: 4500, minStock: 8 },
  { id: "p4", name: "Apollo Amazer 4G 175/65 R15", oem: "Apollo", categoryId: "c2", sku: "TY-002", unit: "Piece", price: 5200, minStock: 6 },
  { id: "p5", name: "Bosch Brake Pad Set", oem: "Bosch", categoryId: "c3", sku: "BS-001", unit: "Set", price: 1850, minStock: 10 },
  { id: "p6", name: "TVS Brake Disc Front", oem: "TVS", categoryId: "c3", sku: "BS-002", unit: "Piece", price: 2400, minStock: 5 },
  { id: "p7", name: "K&N Air Filter", oem: "K&N", categoryId: "c4", sku: "FL-001", unit: "Piece", price: 950, minStock: 12 },
  { id: "p8", name: "Mann Oil Filter", oem: "Mann", categoryId: "c4", sku: "FL-002", unit: "Piece", price: 320, minStock: 25 },
  { id: "p9", name: "Exide Mileage 12V 65Ah", oem: "Exide", categoryId: "c5", sku: "BT-001", unit: "Piece", price: 6200, minStock: 4 },
  { id: "p10", name: "NGK Iridium Spark Plug", oem: "NGK", categoryId: "c6", sku: "SP-001", unit: "Piece", price: 480, minStock: 30 },
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
  { id: "PO-1001", supplierId: "s2", productId: "p1", qty: 50, totalPrice: 32500, status: "Delivered", receivedQty: 50, deliveries: [{ qty: 50, price: 32500, date: today(-12) }], date: today(-15) },
  { id: "PO-1002", supplierId: "s3", productId: "p3", qty: 20, totalPrice: 90000, status: "Partial", receivedQty: 12, deliveries: [{ qty: 12, price: 54000, date: today(-7) }], date: today(-10) },
  { id: "PO-1003", supplierId: "s4", productId: "p5", qty: 30, totalPrice: 55500, status: "Delivered", receivedQty: 30, deliveries: [{ qty: 30, price: 55500, date: today(-5) }], date: today(-8) },
  { id: "PO-1004", supplierId: "s1", productId: "p7", qty: 25, totalPrice: 23750, status: "Pending", receivedQty: 0, deliveries: [], date: today(-2) },
  { id: "PO-1005", supplierId: "s2", productId: "p2", qty: 30, totalPrice: 24600, status: "Partial", receivedQty: 18, deliveries: [{ qty: 18, price: 14760, date: today(-3) }], date: today(-6) },
  { id: "PO-1006", supplierId: "s4", productId: "p9", qty: 10, totalPrice: 62000, status: "Delivered", receivedQty: 10, deliveries: [{ qty: 10, price: 62000, date: today(-1) }], date: today(-4) },
];

const seedUsages: Usage[] = [
  { productId: "p1", qty: 18, jobRef: "JOB-1019" },
  { productId: "p3", qty: 4, jobRef: "JOB-1021" },
  { productId: "p5", qty: 12, jobRef: "JOB-1023" },
  { productId: "p7", qty: 0, jobRef: "" },
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
];

const seedBranches: Branch[] = [
  { id: "b1", name: "Pune — Kothrud" },
  { id: "b2", name: "Mumbai — Andheri" },
  { id: "b3", name: "Bengaluru — Whitefield" },
  { id: "b4", name: "Chennai — OMR" },
];

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
    const sku = generateSku(p.name, cat?.code || "", s.products);
    return { products: [...s.products, { ...p, id: genId("p"), sku }] };
  }),
  updateProduct: (id, p) => set((s) => ({
    products: s.products.map(x => x.id === id ? { ...x, ...p } : x),
  })),

  addSupplier: (sup) => set((s) => ({ suppliers: [...s.suppliers, { ...sup, id: genId("s") }] })),
  updateSupplier: (id, sup) => set((s) => ({
    suppliers: s.suppliers.map(x => x.id === id ? { ...x, ...sup } : x),
  })),

  addPO: (po) => {
    const id = `PO-${1000 + get().pos.length + 10}`;
    set((s) => ({
      pos: [...s.pos, { ...po, id, status: "Pending", receivedQty: 0, deliveries: [], date: today(0) }],
    }));
    return id;
  },
  recordDelivery: (poId, qty, price) => set((s) => ({
    pos: s.pos.map(po => {
      if (po.id !== poId) return po;
      const newReceived = po.receivedQty + qty;
      const status: PurchaseOrder["status"] = newReceived >= po.qty ? "Delivered" : "Partial";
      return {
        ...po,
        receivedQty: newReceived,
        deliveries: [...po.deliveries, { qty, price, date: today(0) }],
        status,
      };
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

  addPartRequest: (r) => set((s) => {
    const received = get().getReceived(r.productId);
    const used = get().getUsed(r.productId);
    const adj = get().getAdjustment(r.productId);
    const stock = received - used + adj;
    const status: PartRequest["status"] = stock >= r.requestedQty ? "Pending" : "Partially Available";
    return {
      partRequests: [...s.partRequests, {
        ...r,
        id: `PR-${String(s.partRequests.length + 1).padStart(3, "0")}`,
        date: today(0),
        status,
      }],
    };
  }),
  approvePartRequest: (id) => set((s) => ({
    partRequests: s.partRequests.map(r => {
      if (r.id !== id) return r;
      // Convert to usage
      get().usages.push({ productId: r.productId, qty: r.requestedQty, jobRef: r.jobRef });
      return { ...r, status: "Approved" };
    }),
    usages: [...s.usages, (() => {
      const r = s.partRequests.find(x => x.id === id)!;
      return { productId: r.productId, qty: r.requestedQty, jobRef: r.jobRef };
    })()],
  })),
  rejectPartRequest: (id) => set((s) => ({
    partRequests: s.partRequests.map(r => r.id === id ? { ...r, status: "Rejected" } : r),
  })),

  getReceived: (productId) => get().pos
    .filter(po => po.productId === productId)
    .reduce((sum, po) => sum + po.receivedQty, 0),
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
