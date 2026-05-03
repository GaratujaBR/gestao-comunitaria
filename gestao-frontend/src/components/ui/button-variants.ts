import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B3A]/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#1F6B3A] text-white shadow hover:bg-[#154B28]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-[1.5px] border-[#88C9A1] bg-transparent text-[#2D5A27] hover:bg-[#D5E8D4]",
        secondary:
          "bg-[#D5E8D4] text-[#2D5A27] shadow-sm hover:bg-[#D5E8D4]/80",
        ghost:
          "bg-transparent text-[#4D4D4D] hover:bg-[#F5F5F4] hover:text-[#1A1A1A]",
        link: "text-[#1F6B3A] underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)
