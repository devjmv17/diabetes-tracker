"use client"

import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full rounded-lg border p-4 shadow-lg transition-all duration-300
            ${
              toast.variant === "destructive"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-white border-gray-200 text-gray-900"
            }
            animate-in slide-in-from-top-2
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold text-sm">{toast.title}</div>
              {toast.description && <div className="text-sm mt-1 opacity-90">{toast.description}</div>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 rounded-md p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
