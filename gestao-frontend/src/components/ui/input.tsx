import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[12px] border border-[#E7E5E4] bg-white px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8A8A8A] focus-visible:outline-none focus-visible:border-[#1F6B3A] focus-visible:ring-2 focus-visible:ring-[#1F6B3A]/15 disabled:cursor-not-allowed disabled:bg-[#F5F5F4] disabled:text-[#8A8A8A]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
