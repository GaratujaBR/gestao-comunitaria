import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Space, Item, Booking, Alert, Cota } from "@/api/types";
import { Home, Package, CalendarDays, Bell, AlertTriangle } from "lucide-react";

function BallIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

interface Stats {
  cotas: number;
  spaces: number;
  items: number;
  bookings: number;
  alertsUnread: number;
  itemsMaintenance: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    cotas: 0, spaces: 0, items: 0, bookings: 0, alertsUnread: 0, itemsMaintenance: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cotas, spaces, items, bookings, alertsData] = await Promise.all([
          api.get<Cota[]>("/api/cotas"),
          api.get<Space[]>("/api/spaces"),
          api.get<Item[]>("/api/items?tipo=comum"),
          api.get<Booking[]>("/api/bookings"),
          api.get<Alert[]>("/api/alerts?lido=false"),
        ]);
        setStats({
          cotas: cotas.filter((c) => c.ativo).length,
          spaces: spaces.filter((s) => !s.parent_slug).length,
          items: items.length,
          bookings: bookings.filter((b) => ["pendente", "confirmada", "em_andamento"].includes(b.status)).length,
          alertsUnread: alertsData.length,
          itemsMaintenance: items.filter((i) => i.estado === "manutencao").length,
        });
        setRecentBookings(bookings.slice(0, 5));
        setAlerts(alertsData.slice(0, 5));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const markRead = async (id: string) => {
    await api.put(`/api/alerts/${id}`, { lido: true });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setStats((s) => ({ ...s, alertsUnread: Math.max(0, s.alertsUnread - 1) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
      </div>
    );
  }

  const cards = [
    { label: "Bolinhas Ativas",   value: stats.cotas,            icon: BallIcon,       color: "bg-[#D5E8D4] text-[#1F6B3A]" },
    { label: "Espaços",           value: stats.spaces,           icon: Home,           color: "bg-green-50 text-green-600"  },
    { label: "Itens no Acervo",   value: stats.items,            icon: Package,        color: "bg-amber-50 text-amber-600"  },
    { label: "Reservas Ativas",   value: stats.bookings,         icon: CalendarDays,   color: "bg-purple-50 text-purple-600"},
    { label: "Alertas Pendentes", value: stats.alertsUnread,     icon: Bell,           color: "bg-red-50 text-red-600"      },
    { label: "Em Manutenção",     value: stats.itemsMaintenance, icon: AlertTriangle,  color: "bg-orange-50 text-orange-600"},
  ];

  const statusMap: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-800",
    em_andamento: "bg-blue-100 text-blue-800",
    concluida: "bg-gray-100 text-gray-800",
    cancelada: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Painel</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-[#E7E5E4] p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{card.value}</p>
              <p className="text-sm text-[#4D4D4D]">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimas reservas */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-5">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Últimas Reservas</h2>
          {recentBookings.length === 0 ? (
            <p className="text-[#8A8A8A] text-sm">Nenhuma reserva.</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#F5F5F4] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{b.space_slug || "-"}</p>
                    <p className="text-xs text-[#8A8A8A]">
                      {b.cota_slug || b.profile_slug} · {new Date(b.data_inicio).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[b.status] || ""}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas recentes */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Alertas Recentes</h2>
            {alerts.length > 0 && (
              <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">
                {alerts.length} não lidos
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-[#8A8A8A]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem alertas pendentes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-2 py-2 border-b border-[#F5F5F4] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{a.titulo}</p>
                    {a.mensagem && (
                      <p className="text-xs text-[#4D4D4D] mt-0.5 truncate">{a.mensagem}</p>
                    )}
                  </div>
                  <button
                    onClick={() => markRead(a.id)}
                    className="shrink-0 text-xs text-[#88C9A1] hover:text-[#1F6B3A] font-semibold mt-0.5"
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
