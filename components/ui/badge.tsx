import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--gov-blue)/0.25)] bg-[hsl(var(--gov-blue)/0.1)] text-[hsl(var(--gov-blue))]",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-[hsl(var(--gov-red)/0.25)] bg-[hsl(var(--gov-red)/0.1)] text-[hsl(var(--gov-red))]",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
