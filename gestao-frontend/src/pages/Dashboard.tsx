import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Profile, Space, Item, Booking, Alert } from "@/api/types";
import { Users, Home, Package, CalendarDays, Bell, AlertTriangle } from "lucide-react";

interface Stats {
  profiles: number;
  spaces: number;
  items: number;
  bookings: number;
  alertsUnread: number;
  itemsMaintenance: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    profiles: 0,
    spaces: 0,
    items: 0,
    bookings: 0,
    alertsUnread: 0,
    itemsMaintenance: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profiles, spaces, items, bookings, alerts] = await Promise.all([
          api.get<Profile[]>("/api/profiles"),
          api.get<Space[]>("/api/spaces"),
          api.get<Item[]>("/api/items"),
          api.get<Booking[]>("/api/bookings"),
          api.get<Alert[]>("/api/alerts?lido=false"),
        ]);
        setStats({
          profiles: profiles.length,
          spaces: spaces.length,
          items: items.length,
          bookings: bookings.length,
          alertsUnread: alerts.length,
          itemsMaintenance: items.filter((i) => i.estado === "manutencao").length,
        });
        setRecentBookings(bookings.slice(0, 5));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  const cards = [
    { label: "Membros", value: stats.profiles, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Espaços", value: stats.spaces, icon: Home, color: "bg-green-50 text-green-600" },
    { label: "Itens no Acervo", value: stats.items, icon: Package, color: "bg-amber-50 text-amber-600" },
    { label: "Reservas", value: stats.bookings, icon: CalendarDays, color: "bg-purple-50 text-purple-600" },
    { label: "Alertas Pendentes", value: stats.alertsUnread, icon: Bell, color: "bg-red-50 text-red-600" },
    { label: "Em Manutenção", value: stats.itemsMaintenance, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
  ];

  const statusMap: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-800",
    em_andamento: "bg-blue-100 text-blue-800",
    concluida: "bg-gray-100 text-gray-800",
    cancelada: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Últimas Reservas</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma reserva encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Espaço</th>
                  <th className="pb-2 font-medium">Responsável</th>
                  <th className="pb-2 font-medium">Início</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2.5">{b.space_slug || "-"}</td>
                    <td className="py-2.5">{b.profile_slug}</td>
                    <td className="py-2.5">
                      {new Date(b.data_inicio).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[b.status] || ""}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
