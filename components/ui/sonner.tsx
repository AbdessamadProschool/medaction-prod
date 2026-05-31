"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      richColors
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:font-medium",
          description: "group-[.toast]:text-gray-500 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-gov-blue group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:bg-gov-green group-[.toaster]:text-white group-[.toaster]:border-[hsl(145,63%,25%)]",
          error:
            "group-[.toaster]:bg-gov-red group-[.toaster]:text-white group-[.toaster]:border-[hsl(348,83%,40%)]",
          warning:
            "group-[.toaster]:bg-gov-gold group-[.toaster]:text-gray-900 group-[.toaster]:border-[hsl(45,93%,38%)]",
          info:
            "group-[.toaster]:bg-gov-blue group-[.toaster]:text-white group-[.toaster]:border-[hsl(213,80%,22%)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
