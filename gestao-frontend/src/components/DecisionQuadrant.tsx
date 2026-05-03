import { useState, useRef, useCallback, useEffect } from "react"
import type { QuadranteType } from "@/api/types"
import { posToQuadrant, getQuadrantBadge } from "@/lib/decisionFramework"

interface DecisionQuadrantProps {
  onChange: (x: number, y: number, quadrante: QuadranteType) => void
}

const SIZE = 280
const DOT_R = 12

const quadrantBgActive: Record<QuadranteType, string> = {
  constituicao: "bg-[#FDEDF2]",
  deliberacao: "bg-[#FFF4E5]",
  operacao: "bg-[#E8F5E9]",
  identidade: "bg-[#FFFDE7]"
}

const dotColor: Record<QuadranteType, string> = {
  constituicao: "#8B2252",
  deliberacao: "#A16207",
  operacao: "#166534",
  identidade: "#7C6E00"
}

export default function DecisionQuadrant({ onChange }: DecisionQuadrantProps) {
  const [pos, setPos] = useState({ x: 75, y: 75 })
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const quadrante = posToQuadrant(pos.x, pos.y)
  const badge = getQuadrantBadge(quadrante)

  const notify = useCallback(
    (x: number, y: number) => {
      const q = posToQuadrant(x, y)
      onChange(x, y, q)
    },
    [onChange]
  )

  useEffect(() => {
    notify(pos.x, pos.y)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clientToPos = useCallback((clientX: number, clientY: number) => {
    const g = containerRef.current?.querySelector("[data-grid]")
    if (!g) return null
    const rect = g.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = 100 - ((clientY - rect.top) / rect.height) * 100
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    }
  }, [])

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      setDragging(true)
      const p = clientToPos(clientX, clientY)
      if (p) {
        setPos(p)
        notify(p.x, p.y)
      }
    },
    [clientToPos, notify]
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return
      const p = clientToPos(clientX, clientY)
      if (p) {
        setPos(p)
        notify(p.x, p.y)
      }
    },
    [dragging, clientToPos, notify]
  )

  const handleEnd = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    if (dragging) {
      const onMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
      const onUp = () => handleEnd()
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
      return () => {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }
    }
  }, [dragging, handleMove, handleEnd])

  const dotX = (pos.x / 100) * SIZE
  const dotY = ((100 - pos.y) / 100) * SIZE

  const isActive = (q: QuadranteType) => quadrante === q

  return (
    <div
      ref={containerRef}
      className="relative select-none flex flex-col items-center"
    >
      {/* Active quadrant indicator */}
      <div className="flex items-center gap-1 mb-1 text-sm font-medium">
        <span>{badge.emoji}</span>
        <span className={badge.color}>{badge.label}</span>
      </div>

      <div className="relative" style={{ width: SIZE + 72, height: SIZE + 52 }}>
        {/* Top label */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[10px] text-[#4D4D4D]/50 font-medium tracking-wider uppercase"
          style={{ top: 2 }}
        >
          Alto Impacto ↑
        </div>

        {/* Left label */}
        <div
          className="absolute -rotate-90 text-[10px] text-[#4D4D4D]/50 whitespace-nowrap font-medium tracking-wider uppercase"
          style={{ left: -2, top: SIZE / 2 + 32 }}
        >
          Pouco Consenso ←
        </div>

        {/* Right label */}
        <div
          className="absolute text-[10px] text-[#4D4D4D]/50 whitespace-nowrap font-medium tracking-wider uppercase"
          style={{ right: 2, top: SIZE / 2 + 32 }}
        >
          → Muito Consenso
        </div>

        {/* Bottom label */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[10px] text-[#4D4D4D]/50 font-medium tracking-wider uppercase"
          style={{ bottom: 4 }}
        >
          ↓ Baixo Impacto
        </div>

        {/* Grid container */}
        <div
          data-grid
          className="absolute border-2 border-[#6B8E23] rounded-[20px] overflow-hidden bg-[#F3EFE0]"
          style={{ width: SIZE, height: SIZE, left: 36, top: 20 }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            e.preventDefault()
            const t = e.touches[0]
            handleStart(t.clientX, t.clientY)
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            const t = e.touches[0]
            handleMove(t.clientX, t.clientY)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            handleEnd()
          }}
        >
          {/* Row 1: Q2 + Q1 */}
          <div className="flex h-1/2">
            <div
              className={`w-1/2 h-full transition-colors duration-200 cursor-pointer ${
                isActive("deliberacao")
                  ? quadrantBgActive.deliberacao
                  : "hover:bg-[#FFF4E5]/40"
              }`}
            />
            <div
              className={`w-1/2 h-full transition-colors duration-200 cursor-pointer ${
                isActive("constituicao")
                  ? quadrantBgActive.constituicao
                  : "hover:bg-[#FDEDF2]/40"
              }`}
            />
          </div>
          {/* Row 2: Q3 + Q4 */}
          <div className="flex h-1/2">
            <div
              className={`w-1/2 h-full transition-colors duration-200 cursor-pointer ${
                isActive("operacao")
                  ? quadrantBgActive.operacao
                  : "hover:bg-[#E8F5E9]/40"
              }`}
            />
            <div
              className={`w-1/2 h-full transition-colors duration-200 cursor-pointer ${
                isActive("identidade")
                  ? quadrantBgActive.identidade
                  : "hover:bg-[#FFFDE7]/40"
              }`}
            />
          </div>

          {/* Cross axes */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#6B8E23]/30 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#6B8E23]/30 pointer-events-none" />

          {/* Quadrant names (subtle) */}
          <span className="absolute top-2 right-2 text-[9px] text-[#4D4D4D]/40 font-medium pointer-events-none">
            Constituição
          </span>
          <span className="absolute top-2 left-2 text-[9px] text-[#4D4D4D]/40 font-medium pointer-events-none">
            Deliberação
          </span>
          <span className="absolute bottom-2 left-2 text-[9px] text-[#4D4D4D]/40 font-medium pointer-events-none">
            Operação
          </span>
          <span className="absolute bottom-2 right-2 text-[9px] text-[#4D4D4D]/40 font-medium pointer-events-none">
            Identidade
          </span>

          {/* Draggable dot */}
          <div
            className={`absolute rounded-full border-2 border-white shadow-md transition-transform duration-150 pointer-events-none ${
              dragging ? "scale-110 shadow-lg" : "animate-pulse"
            }`}
            style={{
              width: DOT_R * 2,
              height: DOT_R * 2,
              left: dotX - DOT_R,
              top: dotY - DOT_R,
              backgroundColor: dotColor[quadrante],
              boxShadow: `0 0 0 4px ${dotColor[quadrante]}20`
            }}
          />
        </div>
      </div>
    </div>
  )
}
