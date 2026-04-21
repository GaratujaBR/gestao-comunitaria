import { useState } from "react";
import type { Space } from "@/api/types";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

import imgNormal from "../../imgs/espaços-reserva.png";
import imgChurrasqueira from "../../imgs/hover-churrasqueira.png";
import imgCasaApoio1 from "../../imgs/hover-casa-apoio-1.png";
import imgCasaApoio2 from "../../imgs/hover-casa-apoio-2.png";

// ── Configuração: ajuste os slugs para corresponder ao banco ──────────────────
const MAP_SLUGS = {
  churrasqueira: "churrasqueira",
  casaApoio1: "casa.apoio.1",
  casaApoio2: "casa.apoio.2",
};

// ── Zonas clicáveis (coordenadas em % do container) ──────────────────────────
// Ajuste top/left/width/height se precisar afinar o alinhamento visual
const zones = [
  {
    id: "churrasqueira",
    label: "Churrasqueira com Piscina",
    slug: MAP_SLUGS.churrasqueira,
    image: imgChurrasqueira,
    area: { top: "28%", left: "5%", width: "33%", height: "60%" },
  },
  {
    id: "casa-apoio-1",
    label: "Casa de Apoio 1",
    slug: MAP_SLUGS.casaApoio1,
    image: imgCasaApoio1,
    area: { top: "50%", left: "63%", width: "27%", height: "38%" },
  },
  {
    id: "casa-apoio-2",
    label: "Casa de Apoio 2",
    slug: MAP_SLUGS.casaApoio2,
    image: imgCasaApoio2,
    area: { top: "4%", left: "53%", width: "42%", height: "44%" },
  },
];

interface Props {
  spaces: Space[];
  onSelect: (spaceSlug: string) => void;
}

export default function SpaceMap({ spaces, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileActive, setMobileActive] = useState<string | null>(null);

  const isTouchDevice = () =>
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  const handleClick = (zone: (typeof zones)[number]) => {
    // Primeiro clique/toque → mostra confirmação; segundo → aciona
    if (mobileActive === zone.id) {
      setMobileActive(null);
      onSelect(zone.slug);
    } else {
      setMobileActive(zone.id);
    }
  };

  const activeZone = zones.find(
    (z) => z.id === (hovered ?? mobileActive)
  );

  const mobileZone = zones.find((z) => z.id === mobileActive);

  return (
    <div className="mb-6">
      {/* Mapa */}
      <div
        className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden select-none"
        onClick={(e) => {
          // Limpa confirmação mobile se clicar fora de uma zona
          if (e.target === e.currentTarget) setMobileActive(null);
        }}
      >
        {/* Imagem base */}
        <img
          src={imgNormal}
          alt="Mapa da ecovila"
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Overlays de hover — sobrepostos à imagem base com transição suave */}
        {zones.map((zone) => (
          <img
            key={zone.id}
            src={zone.image}
            alt=""
            aria-hidden
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 ${
              activeZone?.id === zone.id ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Hotspots clicáveis */}
        {zones.map((zone) => {
          const exists = spaces.some((s) => s.slug === zone.slug);
          return (
            <div
              key={`hs-${zone.id}`}
              className={`absolute z-10 rounded-lg transition-all duration-150 ${
                !exists && "opacity-50"
              }`}
              style={{ ...zone.area, cursor: "pointer" }}
              onMouseEnter={() => !isTouchDevice() && setHovered(zone.id)}
              onMouseLeave={() => !isTouchDevice() && setHovered(null)}
              onClick={() => handleClick(zone)}
              title={exists ? zone.label : `${zone.label} (não cadastrado)`}
            />
          );
        })}
      </div>

      {/* Barra de confirmação mobile */}
      {mobileZone && (
        <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 truncate">
                {mobileZone.label}
              </p>
              <p className="text-xs text-amber-700">
                {isTouchDevice() ? "Toque" : "Clique"} em "Reservar" para continuar
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMobileActive(null)}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setMobileActive(null);
                onSelect(mobileZone.slug);
              }}
            >
              Reservar
            </Button>
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="max-w-4xl mx-auto mt-2 flex flex-wrap gap-3 justify-center">
        {zones.map((zone) => {
          const exists = spaces.some((s) => s.slug === zone.slug);
          return (
            <span
              key={zone.id}
              className={`flex items-center gap-1.5 text-xs ${
                exists ? "text-stone-500" : "text-stone-400"
              }`}
            >
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  exists ? "bg-green-500" : "bg-stone-300"
                }`}
              />
              {zone.label}
              {!exists && (
                <span className="text-stone-400 italic">(não cadastrado)</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
