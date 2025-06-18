"use client"

import * as React from "react"

// Tipos básicos para el toast
interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  duration?: number
  variant?: "default" | "destructive"
}

// Estado global de toasts
let toasts: ToastProps[] = []
const listeners: Array<(toasts: ToastProps[]) => void> = []

// Función para generar IDs únicos
function genId() {
  return Math.random().toString(36).substr(2, 9)
}

// Función para notificar a los listeners
function dispatch() {
  listeners.forEach((listener) => listener([...toasts]))
}

// Función principal para mostrar toast
export function toast({ title, description, variant = "default", duration = 3000, ...props }: Omit<ToastProps, "id">) {
  const id = genId()
  const newToast: ToastProps = {
    id,
    title,
    description,
    variant,
    duration,
    ...props,
  }

  toasts.push(newToast)
  dispatch()

  // Auto-remove después del duration
  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      dispatch()
    }, duration)
  }

  return {
    id,
    dismiss: () => {
      toasts = toasts.filter((t) => t.id !== id)
      dispatch()
    },
  }
}

// Hook para usar toasts en componentes
export function useToast() {
  const [state, setState] = React.useState<ToastProps[]>(toasts)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    toasts: state,
    toast,
    dismiss: (toastId: string) => {
      toasts = toasts.filter((t) => t.id !== toastId)
      dispatch()
    },
  }
}
