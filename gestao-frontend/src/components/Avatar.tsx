import { avatarColor, initials } from "@/lib/avatar-utils"

interface AvatarProps {
  slug: string
  nome: string
  foto_url?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
}

export default function Avatar({
  slug,
  nome,
  foto_url,
  size = "md",
  className = "",
  onClick
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs rounded-xl",
    md: "w-11 h-11 text-sm rounded-2xl",
    lg: "w-16 h-16 text-lg rounded-2xl"
  }

  const inner = foto_url ? (
    <img src={foto_url} alt={nome} className={`object-cover ${sizeClasses[size]} ${className}`} />
  ) : (
    <div className={`flex items-center justify-center font-bold ${avatarColor(slug)} ${sizeClasses[size]} ${className}`}>
      {initials(nome)}
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`hover:ring-2 hover:ring-[#88C9A1] hover:scale-105 transition-all ${sizeClasses[size].includes("rounded") ? "" : ""}`}
        title={nome}
      >
        {inner}
      </button>
    )
  }

  return inner
}
