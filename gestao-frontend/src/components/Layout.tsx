import { NavLink, Outlet } from "react-router-dom";
import {
  Users,
  Home,
  Package,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Bell,
  LayoutDashboard,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Painel" },
  { to: "/perfis", icon: Users, label: "Perfis" },
  { to: "/espacos", icon: Home, label: "Espaços" },
  { to: "/acervo", icon: Package, label: "Acervo" },
  { to: "/reservas", icon: CalendarDays, label: "Reservas" },
  { to: "/logs", icon: ClipboardList, label: "Logs" },
  { to: "/wiki", icon: BookOpen, label: "Wiki" },
  { to: "/alertas", icon: Bell, label: "Alertas" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-card border-r border-border shadow-sm transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg text-foreground">Comunidade</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`
              }
              end={item.to === "/"}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 px-6 py-4 bg-card border-b border-border lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="text-foreground">Comunidade</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
