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
  Sheet,
  Wrench,
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
  { to: "/planilha", icon: Sheet, label: "Planilha" },
  { to: "/chamados", icon: Wrench, label: "Chamados" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r shadow-sm transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500">
              Vilarejo Ecológico
            </span>
            <span className="text-lg font-bold text-gray-800">
              Terra de Canaã
            </span>
          </div>
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
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100"
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
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-gray-800">Comunidade</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
