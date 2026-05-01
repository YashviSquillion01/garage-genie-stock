import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Truck,
  ClipboardList,
  Boxes,
  PackageCheck,
  ScrollText,
  Receipt,
  Wrench,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/categories", icon: FolderTree, label: "Categories" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/purchase-orders", icon: ClipboardList, label: "Purchase Orders" },
  { to: "/stock", icon: Boxes, label: "Stock" },
  { to: "/reconciliation", icon: PackageCheck, label: "Reconciliation" },
  { to: "/part-requests", icon: ScrollText, label: "Part Requests" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
];

export default function AppLayout() {
  const location = useLocation();
  const current = nav.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== "/")?.label || "Dashboard";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-sidebar flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <div className="h-9 w-9 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">GarageOS</div>
            <div className="text-[11px] text-muted-foreground">Inventory Suite</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-semibold">
              RS
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">Rohit Sharma</div>
              <div className="text-xs text-muted-foreground truncate">Inventory Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/60 backdrop-blur flex items-center justify-between px-6">
          <div>
            <div className="text-xs text-muted-foreground">Inventory</div>
            <h1 className="text-lg font-semibold leading-tight">{current}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72 hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search inventory…"
                className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="h-9 w-9 rounded-md border bg-card flex items-center justify-center hover:bg-muted">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
