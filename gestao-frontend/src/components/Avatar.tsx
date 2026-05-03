const AVATAR_COLORS = [
  "bg-green-200 text-green-800",
  "bg-blue-200 text-blue-800",
  "bg-purple-200 text-purple-800",
  "bg-amber-200 text-amber-800",
  "bg-rose-200 text-rose-800",
  "bg-cyan-200 text-cyan-800",
  "bg-indigo-200 text-indigo-800",
  "bg-teal-200 text-teal-800"
]

export function avatarColor(slug: string) {
  let h = 0
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

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
