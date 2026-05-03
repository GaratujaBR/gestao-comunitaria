import { avatarColor, initials } from "@/lib/avatar-utils"

interface AvatarProps {
  slug: string
  nome: string
  foto_url?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function Avatar({
  slug,
  nome,
  foto_url,
  size = "md",
  className = ""
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs rounded-xl",
    md: "w-11 h-11 text-sm rounded-2xl",
    lg: "w-16 h-16 text-lg rounded-2xl"
  }

  if (foto_url) {
    return (
      <img
        src={foto_url}
        alt={nome}
        className={`object-cover ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center font-bold ${avatarColor(slug)} ${sizeClasses[size]} ${className}`}
    >
      {initials(nome)}
    </div>
  )
}
