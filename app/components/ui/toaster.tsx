"use client"

import { useToast } from "./use-toast"
import { Toast } from "./toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </>
  )
}
