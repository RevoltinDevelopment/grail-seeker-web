'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { ToastContainer, type ToastMessage } from '@/components/ui/Toast'

interface ToastContextType {
  showToast: (
    title: string,
    message: string,
    type?: ToastMessage['type'],
    duration?: number
  ) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback(
    (
      title: string,
      message: string,
      type: ToastMessage['type'] = 'info',
      duration = 5000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const newToast: ToastMessage = {
        id,
        title,
        message,
        type,
        duration,
      }

      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
