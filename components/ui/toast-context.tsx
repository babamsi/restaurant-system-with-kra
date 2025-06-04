"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast"

type ToastType = "default" | "destructive" | "success" | "warning" | "info"

interface ToastData {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = (toast: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, ...toast }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <ToastProvider>
        {children}
        {toasts.map(({ id, title, description, action, type = "default", duration = 5000 }) => (
          <Toast key={id} variant={type} onOpenChange={(open) => !open && removeToast(id)} duration={duration}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action && <ToastAction altText="Action">{action}</ToastAction>}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastContextProvider")
  }
  return context
}
