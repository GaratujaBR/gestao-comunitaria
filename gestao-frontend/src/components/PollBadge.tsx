import type { QuadranteType } from "@/api/types"
import { getQuadrantBadge } from "@/lib/decisionFramework"

const solidColors: Record<QuadranteType, string> = {
  constituicao: "bg-[#8B2252] text-white",
  deliberacao: "bg-[#A16207] text-white",
  operacao: "bg-[#166534] text-white",
  identidade: "bg-[#7C6E00] text-white"
}

export default function PollBadge({ quadrante }: { quadrante: QuadranteType }) {
  const { emoji, label } = getQuadrantBadge(quadrante)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${solidColors[quadrante]}`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}
