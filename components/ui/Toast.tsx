'use client'

import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const duration = toast.duration || 5000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(toast.id), 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  const bgColor = {
    success: 'bg-success-green',
    info: 'bg-collector-blue',
    warning: 'bg-yellow-500',
    error: 'bg-error-red',
  }[toast.type]

  return (
    <div
      className={`pointer-events-auto mb-4 w-full max-w-md overflow-hidden rounded-lg shadow-lg transition-all ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${bgColor} `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{toast.title}</p>
            <p className="mt-1 text-sm text-white">{toast.message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(toast.id), 300)
            }}
            className="ml-4 inline-flex rounded-md text-white hover:text-slate-200 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}) {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col items-end p-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}
