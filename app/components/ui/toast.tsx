"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  onClose?: () => void
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300",
        "bg-white border-gray-200",
        variant === "destructive" && "bg-red-50 border-red-200 text-red-800",
        "animate-in slide-in-from-top-2",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <div className={cn("font-semibold text-sm", variant === "destructive" ? "text-red-800" : "text-gray-900")}>
              {title}
            </div>
          )}
          {description && (
            <div className={cn("text-sm mt-1", variant === "destructive" ? "text-red-700" : "text-gray-600")}>
              {description}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className={cn(
            "ml-4 rounded-md p-1 hover:bg-gray-100 transition-colors",
            variant === "destructive" && "hover:bg-red-100",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
