import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-input bg-white dark:bg-gray-900 px-4 py-3 text-base shadow-sm",
          "placeholder:text-muted-foreground",
          "hover:border-gray-300 dark:hover:border-gray-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gov-blue))] focus-visible:border-[hsl(var(--gov-blue))] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800",
          "resize-y transition-all duration-200",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
