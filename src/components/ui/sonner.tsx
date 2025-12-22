"use client"

import {
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-primary !text-primary-foreground border-border shadow-lg rounded-lg font-sans",

          description: "group-[.toast]:!text-primary-foreground/80",

          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-primary font-medium",

          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white hover:bg-white/20",

          error: "!text-primary-foreground",
          success: "!text-primary-foreground",
          warning: "!text-primary-foreground",
          info: "!text-primary-foreground",
        },
      }}
      icons={{
        success: <CheckCircle2Icon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <AlertTriangleIcon className="size-5" />,
        error: <XCircleIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin text-primary-foreground/50" />,
      }}
      {...props}
    />
  )
}

export { Toaster }