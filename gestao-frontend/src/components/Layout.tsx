import { NavLink, Outlet } from "react-router-dom";
import {
  Package,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Bell,
  LayoutDashboard,
  CircleDollarSign,
  Wrench,
  Menu,
  X,
  Sprout,
  CalendarRange,
} from "lucide-react";

function BallIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}
import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { Alert } from "@/api/types";
import caliandraLogo from "../../imgs/caliandra-logo.png";

const navItems = [
  { to: "/",         icon: LayoutDashboard, label: "Painel"     },
  { to: "/cotas",    icon: BallIcon,        label: "Bolinhas"   },
  { to: "/reservas", icon: CalendarDays,    label: "Reservas"   },
  { to: "/acervo",   icon: Package,         label: "Acervo"     },
  { to: "/wiki",     icon: BookOpen,        label: "Wiki"       },
  { to: "/planilha", icon: CircleDollarSign,label: "Financeiro" },
  { to: "/chamados", icon: Wrench,          label: "Chamados"   },
  { to: "/eventos",  icon: CalendarRange,   label: "Eventos"    },
  { to: "/logs",     icon: ClipboardList,   label: "Logs"       },
];

function BellMenu() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadAlerts = async () => {
    try {
      setAlerts(await api.get<Alert[]>("/api/alerts?lido=false"));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadAlerts();
    const id = setInterval(loadAlerts, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: string) => {
    await api.put(`/api/alerts/${id}`, { lido: true });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllRead = async () => {
    await Promise.all(alerts.map((a) => api.put(`/api/alerts/${a.id}`, { lido: true })));
    setAlerts([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-[#F5F5F4] transition-colors"
      >
        <Bell className="w-5 h-5 text-[#4D4D4D]" />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E7E5E4] rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E5E4]">
            <span className="text-sm font-semibold text-[#1A1A1A]">Notificações</span>
            {alerts.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#1F6B3A] hover:underline font-medium">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-[#8A8A8A] px-4 py-6 text-center">Sem notificações pendentes</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="px-4 py-3 border-b border-[#F5F5F4] last:border-0 hover:bg-[#F8F7F4]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{a.titulo}</p>
                      {a.mensagem && (
                        <p className="text-xs text-[#4D4D4D] mt-0.5 truncate">{a.mensagem}</p>
                      )}
                    </div>
                    <button
                      onClick={() => markRead(a.id)}
                      className="shrink-0 text-xs text-[#88C9A1] hover:text-[#1F6B3A] font-medium mt-0.5"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F7F4]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transform bg-white border-r border-[#E7E5E4] shadow-sm transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-5 bg-[#D5E8D4] border-b border-[#88C9A1]/40">
          <div className="flex flex-col items-center gap-2">
            <img
              src={caliandraLogo}
              alt="Terra de Canaã"
              className="h-12 w-auto object-contain"
              draggable={false}
            />
            <div className="text-center">
              <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#2D5A27]">
                Vilarejo Ecológico
              </div>
              <div className="text-base font-extrabold text-[#1A1A1A] tracking-[0.02em]">
                Terra de Canaã
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors border-l-2 pl-[10px] ${
                  isActive
                    ? "bg-[#ECF7EE] text-[#1F6B3A] border-l-[#1F6B3A] font-semibold"
                    : "text-[#4D4D4D] hover:bg-[#F5F5F4] hover:text-[#1A1A1A] border-transparent font-medium"
                }`
              }
              end={item.to === "/"}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[#F5F5F4]">
          <div className="flex items-center gap-2 text-[#8A8A8A]">
            <Sprout className="w-3.5 h-3.5 shrink-0 text-[#88C9A1]" />
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
        {/* Header mobile */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-[#E7E5E4] lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="flex-1 font-bold text-[#1A1A1A]">Terra de Canaã</span>
          <BellMenu />
        </header>
        {/* Topbar desktop */}
        <div className="hidden lg:flex items-center justify-end px-6 py-2 bg-white border-b border-[#E7E5E4]">
          <BellMenu />
        </div>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
