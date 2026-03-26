import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Profile, Space, Item, Booking } from "@/api/types";
import { Table2 } from "lucide-react";

type Tab = "perfis" | "espacos" | "acervo" | "reservas";

const tabs: { key: Tab; label: string }[] = [
  { key: "perfis", label: "Perfis" },
  { key: "espacos", label: "Espacos" },
  { key: "acervo", label: "Acervo" },
  { key: "reservas", label: "Reservas" },
];

export default function Spreadsheet() {
  const [activeTab, setActiveTab] = useState<Tab>("perfis");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [p, s, i, b] = await Promise.all([
          api.get<Profile[]>("/api/profiles"),
          api.get<Space[]>("/api/spaces"),
          api.get<Item[]>("/api/items"),
          api.get<Booking[]>("/api/bookings"),
        ]);
        setProfiles(p);
        setSpaces(s);
        setItems(i);
        setBookings(b);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const roleColors: Record<string, string> = {
    fundador: "bg-purple-100 text-purple-700",
    construtor: "bg-blue-100 text-blue-700",
    cotista: "bg-green-100 text-green-700",
    visitante: "bg-gray-100 text-gray-700",
  };

  const estadoColors: Record<string, string> = {
    novo: "bg-green-100 text-green-700",
    bom: "bg-blue-100 text-blue-700",
    regular: "bg-yellow-100 text-yellow-700",
    manutencao: "bg-orange-100 text-orange-700",
    indisponivel: "bg-red-100 text-red-700",
  };

  const statusColors: Record<string, string> = {
    ativo: "bg-green-100 text-green-700",
    manutencao: "bg-yellow-100 text-yellow-700",
    inativo: "bg-gray-100 text-gray-700",
  };

  const bookingStatusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-800",
    em_andamento: "bg-blue-100 text-blue-800",
    concluida: "bg-gray-100 text-gray-800",
    cancelada: "bg-red-100 text-red-800",
  };

  const renderBadge = (value: string | null, colors: Record<string, string>) => {
    if (!value) return <span className="text-gray-400">-</span>;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || "bg-gray-100 text-gray-700"}`}>
        {value}
      </span>
    );
  };

  const renderProfiles = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left text-gray-500">
          <th className="px-4 py-3 font-medium">Slug</th>
          <th className="px-4 py-3 font-medium">Nome Completo</th>
          <th className="px-4 py-3 font-medium">Nome Curto</th>
          <th className="px-4 py-3 font-medium">Email</th>
          <th className="px-4 py-3 font-medium">Telefone</th>
          <th className="px-4 py-3 font-medium">Papel</th>
          <th className="px-4 py-3 font-medium">Lote</th>
          <th className="px-4 py-3 font-medium">Ativo</th>
        </tr>
      </thead>
      <tbody>
        {profiles.map((p) => (
          <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
            <td className="px-4 py-3 font-medium">{p.nome_completo}</td>
            <td className="px-4 py-3">{p.nome_curto || "-"}</td>
            <td className="px-4 py-3">{p.email || "-"}</td>
            <td className="px-4 py-3">{p.telefone || "-"}</td>
            <td className="px-4 py-3">{renderBadge(p.role, roleColors)}</td>
            <td className="px-4 py-3">{p.lote || "-"}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {p.ativo ? "Sim" : "Nao"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSpaces = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left text-gray-500">
          <th className="px-4 py-3 font-medium">Slug</th>
          <th className="px-4 py-3 font-medium">Nome</th>
          <th className="px-4 py-3 font-medium">Tipo</th>
          <th className="px-4 py-3 font-medium">Capacidade</th>
          <th className="px-4 py-3 font-medium">Area (m2)</th>
          <th className="px-4 py-3 font-medium">Responsavel</th>
          <th className="px-4 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {spaces.map((s) => (
          <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs">{s.slug}</td>
            <td className="px-4 py-3 font-medium">{s.nome}</td>
            <td className="px-4 py-3">{s.tipo || "-"}</td>
            <td className="px-4 py-3">{s.capacidade ?? "-"}</td>
            <td className="px-4 py-3">{s.area_m2 ?? "-"}</td>
            <td className="px-4 py-3">{s.responsavel_slug || "-"}</td>
            <td className="px-4 py-3">{renderBadge(s.status, statusColors)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderItems = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left text-gray-500">
          <th className="px-4 py-3 font-medium">Codigo</th>
          <th className="px-4 py-3 font-medium">Nome</th>
          <th className="px-4 py-3 font-medium">Categoria</th>
          <th className="px-4 py-3 font-medium">Local</th>
          <th className="px-4 py-3 font-medium">Estado</th>
          <th className="px-4 py-3 font-medium">Usos</th>
          <th className="px-4 py-3 font-medium">Tags</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs">{item.codigo}</td>
            <td className="px-4 py-3 font-medium">{item.nome}</td>
            <td className="px-4 py-3">{item.categoria || "-"}</td>
            <td className="px-4 py-3">{item.space_slug || "-"}</td>
            <td className="px-4 py-3">{renderBadge(item.estado, estadoColors)}</td>
            <td className="px-4 py-3">{item.vezes_usado}</td>
            <td className="px-4 py-3">{item.tags?.join(", ") || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderBookings = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left text-gray-500">
          <th className="px-4 py-3 font-medium">Espaco</th>
          <th className="px-4 py-3 font-medium">Responsavel</th>
          <th className="px-4 py-3 font-medium">Tipo</th>
          <th className="px-4 py-3 font-medium">Inicio</th>
          <th className="px-4 py-3 font-medium">Fim</th>
          <th className="px-4 py-3 font-medium">Pessoas</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Finalidade</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => (
          <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
            <td className="px-4 py-3">{b.space_slug || "-"}</td>
            <td className="px-4 py-3 font-medium">{b.profile_slug}</td>
            <td className="px-4 py-3">{b.tipo_uso || "-"}</td>
            <td className="px-4 py-3">{new Date(b.data_inicio).toLocaleDateString("pt-BR")}</td>
            <td className="px-4 py-3">{new Date(b.data_fim).toLocaleDateString("pt-BR")}</td>
            <td className="px-4 py-3">{b.numero_pessoas ?? "-"}</td>
            <td className="px-4 py-3">{renderBadge(b.status, bookingStatusColors)}</td>
            <td className="px-4 py-3">{b.finalidade || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const tableRenderers: Record<Tab, () => React.JSX.Element> = {
    perfis: renderProfiles,
    espacos: renderSpaces,
    acervo: renderItems,
    reservas: renderBookings,
  };

  const emptyMessages: Record<Tab, string> = {
    perfis: "Nenhum perfil cadastrado.",
    espacos: "Nenhum espaco cadastrado.",
    acervo: "Nenhum item encontrado.",
    reservas: "Nenhuma reserva encontrada.",
  };

  const dataCounts: Record<Tab, number> = {
    perfis: profiles.length,
    espacos: spaces.length,
    acervo: items.length,
    reservas: bookings.length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Planilha</h1>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-75">({dataCounts[tab.key]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : dataCounts[activeTab] === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Table2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{emptyMessages[activeTab]}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          {tableRenderers[activeTab]()}
        </div>
      )}
    </div>
  );
}
