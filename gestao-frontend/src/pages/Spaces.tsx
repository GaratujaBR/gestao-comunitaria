import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Space } from "@/api/types";
import { Home, DoorOpen } from "lucide-react";

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Space[]>("/api/spaces")
      .then(setSpaces)
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    ativo: "bg-green-100 text-green-700",
    manutencao: "bg-yellow-100 text-yellow-700",
    inativo: "bg-gray-100 text-gray-700",
  };

  const tipoLabels: Record<string, string> = {
    casa_coletiva: "Casa Coletiva",
    casa_apoio: "Casa de Apoio",
    lazer: "Lazer",
    obra: "Obra",
  };

  const topLevel = spaces.filter((s) => !s.parent_slug);
  const childrenOf = (slug: string) => spaces.filter((s) => s.parent_slug === slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Espaços</h1>

      {topLevel.length === 0 ? (
        <div className="text-center py-12 text-[#8A8A8A]">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum espaço cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topLevel.map((s) => {
            const rooms = childrenOf(s.slug);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-[#E7E5E4] p-5">
                <div className="mb-2">
                  <h3 className="font-semibold text-[#1A1A1A]">{s.nome}</h3>
                  <p className="text-xs text-[#8A8A8A]">{s.slug}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || ""}`}>
                    {s.status}
                  </span>
                  {s.tipo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {tipoLabels[s.tipo] || s.tipo}
                    </span>
                  )}
                </div>
                {s.capacidade && (
                  <p className="text-sm text-[#4D4D4D] mt-2">Capacidade: {s.capacidade} pessoas</p>
                )}
                {s.area_m2 && (
                  <p className="text-sm text-[#4D4D4D]">Área: {s.area_m2} m²</p>
                )}

                {rooms.length > 0 && (
                  <div className="mt-4 border-t border-[#F5F5F4] pt-3">
                    <span className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">
                      Quartos ({rooms.length})
                    </span>
                    <ul className="mt-2 space-y-1">
                      {rooms.map((r) => (
                        <li key={r.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-[#F8F7F4]">
                          <div className="flex items-center gap-1.5">
                            <DoorOpen className="w-3.5 h-3.5 text-[#8A8A8A] shrink-0" />
                            <span className="text-sm font-medium text-[#1A1A1A]">{r.nome}</span>
                            {r.capacidade && (
                              <span className="text-xs text-[#8A8A8A]">{r.capacidade} p.</span>
                            )}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || ""}`}>
                            {r.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
