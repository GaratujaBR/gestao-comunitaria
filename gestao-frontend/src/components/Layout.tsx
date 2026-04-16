import { NavLink, Outlet } from "react-router-dom";
import {
  Users,
  Building2,
  Package,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Bell,
  LayoutDashboard,
  Table2,
  Wrench,
  Vote,
  Menu,
  X,
  Leaf,
  Sprout,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Painel" },
  { to: "/perfis", icon: Users, label: "Perfis" },
  { to: "/espacos", icon: Building2, label: "Espaços" },
  { to: "/acervo", icon: Package, label: "Acervo" },
  { to: "/reservas", icon: CalendarDays, label: "Reservas" },
  { to: "/logs", icon: ClipboardList, label: "Logs" },
  { to: "/wiki", icon: BookOpen, label: "Wiki" },
  { to: "/alertas", icon: Bell, label: "Alertas" },
  { to: "/planilha", icon: Table2, label: "Planilha" },
  { to: "/chamados", icon: Wrench, label: "Chamados" },
  { to: "/enquetes", icon: Vote, label: "Enquetes" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stone-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transform bg-white border-r border-stone-200 shadow-sm transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabeçalho com identidade da ecovila */}
        <div className="px-6 py-5 bg-gradient-to-br from-green-900 to-emerald-700">
          <div className="flex items-center gap-2.5">
            <Leaf className="w-6 h-6 text-green-200 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] tracking-[0.2em] uppercase text-green-300">
                Vilarejo Ecológico
              </span>
              <span className="text-lg font-bold text-white">
                Terra de Canaã
              </span>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-800 border-l-2 border-green-700 pl-[10px]"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-800 border-l-2 border-transparent pl-[10px]"
                }`
              }
              end={item.to === "/"}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Rodapé da comunidade */}
        <div className="px-5 py-4 border-t border-stone-100">
          <div className="flex items-center gap-2 text-stone-400">
            <Sprout className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs italic">Crescendo juntos</span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-stone-200 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-stone-800">Terra de Canaã</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
