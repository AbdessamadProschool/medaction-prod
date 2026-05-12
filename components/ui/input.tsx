import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input bg-white dark:bg-gray-900 px-4 py-2 text-base shadow-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "hover:border-gray-300 dark:hover:border-gray-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gov-blue))] focus-visible:border-[hsl(var(--gov-blue))] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 disabled:hover:border-input",
          "md:text-sm",
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
