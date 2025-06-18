"use client"

import { useState, useCallback } from "react"

interface ToastMessage {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback(({ title, description, variant = "default" }: Omit<ToastMessage, "id">) => {
    const id = `toast-${++toastCounter}`
    const newToast: ToastMessage = { id, title, description, variant }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)

    return { id }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}

// Export standalone toast function
export const toast = ({ title, description, variant = "default" }: Omit<ToastMessage, "id">) => {
  // For standalone usage, we'll use a simple alert as fallback
  if (typeof window !== "undefined") {
    if (variant === "destructive") {
      alert(`Error: ${title}\n${description || ""}`)
    } else {
      alert(`${title}\n${description || ""}`)
    }
  }
}
