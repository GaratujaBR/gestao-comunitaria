import type { Enquete } from "@/api/types"
import { calculateLegitimacy } from "@/lib/decisionFramework"

export default function LegitimacyMeter({
  enquete,
  totalMembers
}: {
  enquete: Enquete
  totalMembers: number
}) {
  const { quorumStatus, approvalStatus, message } = calculateLegitimacy(
    enquete,
    totalMembers
  )

  const quorumPct = Math.min(enquete.quorum_percent ?? 0, 100)
  const approvalPct = Math.min(enquete.approval_percent ?? 0, 100)

  const isFullyLegit = quorumStatus === "met" && approvalStatus === "met"

  return (
    <div
      className={`space-y-3 p-4 rounded-[20px] border border-[#E7E5E4] transition-colors duration-300 ${
        isFullyLegit ? "bg-[#ECF7EE] ring-1 ring-[#1F6B3A]/20" : "bg-[#F8F7F4]"
      }`}
    >
      <p className="text-sm font-medium text-[#1A1A1A] mb-3">{message}</p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4D4D4D]">
            Quorum ({enquete.quorum_required}%)
          </span>
          <span
            className={
              quorumStatus === "met"
                ? "text-[#1F6B3A] font-medium"
                : "text-[#4D4D4D]"
            }
          >
            {quorumPct.toFixed(0)}%{" "}
            {quorumStatus === "met"
              ? "✅"
              : `(faltam ${enquete.quorum_required - quorumPct < 0 ? 0 : (enquete.quorum_required - quorumPct).toFixed(0)}%)`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#E7E5E4] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              quorumStatus === "met" ? "bg-[#1F6B3A]" : "bg-[#88C9A1]"
            }`}
            style={{ width: `${quorumPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4D4D4D]">
            Aprovação ({enquete.approval_threshold}%)
          </span>
          <span
            className={
              approvalStatus === "met"
                ? "text-[#1F6B3A] font-medium"
                : "text-[#4D4D4D]"
            }
          >
            {approvalPct.toFixed(0)}%{" "}
            {approvalStatus === "met"
              ? "✅"
              : `(faltam ${enquete.approval_threshold - approvalPct < 0 ? 0 : (enquete.approval_threshold - approvalPct).toFixed(0)}%)`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#E7E5E4] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              approvalStatus === "met" ? "bg-[#1F6B3A]" : "bg-[#88C9A1]"
            }`}
            style={{ width: `${approvalPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
