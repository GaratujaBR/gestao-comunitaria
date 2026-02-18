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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Membros", value: stats.profiles, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Espaços", value: stats.spaces, icon: Home, color: "bg-accent/10 text-accent" },
    { label: "Itens no Acervo", value: stats.items, icon: Package, color: "bg-secondary text-secondary-foreground" },
    { label: "Reservas", value: stats.bookings, icon: CalendarDays, color: "bg-primary/10 text-primary" },
    { label: "Alertas Pendentes", value: stats.alertsUnread, icon: Bell, color: "bg-destructive/10 text-destructive" },
    { label: "Em Manutenção", value: stats.itemsMaintenance, icon: AlertTriangle, color: "bg-accent/10 text-accent" },
  ];

  const statusMap: Record<string, string> = {
    pendente: "bg-accent/15 text-accent",
    confirmada: "bg-primary/15 text-primary",
    em_andamento: "bg-primary/10 text-primary",
    concluida: "bg-secondary text-muted-foreground",
    cancelada: "bg-destructive/15 text-destructive",
  };

  return (
    <div>
      <h1 className="text-2xl text-foreground mb-6">Painel</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg text-foreground mb-4">Últimas Reservas</h2>
        {recentBookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma reserva encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Espaço</th>
                  <th className="pb-2 font-medium">Responsável</th>
                  <th className="pb-2 font-medium">Início</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
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
