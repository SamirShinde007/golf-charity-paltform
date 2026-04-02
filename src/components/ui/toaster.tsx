'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

// Simple global toast state
let addToast: (message: string, type?: ToastType) => void = () => {}

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info'),
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToast = (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm animate-fade-up ${
            t.type === 'success' ? 'bg-jade-500/15 border-jade-500/30 text-jade-300' :
            t.type === 'error'   ? 'bg-destructive/15 border-destructive/30 text-red-300' :
            'bg-card border-border text-foreground'
          }`}>
          {t.type === 'success' && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          {t.type === 'error'   && <AlertCircle  className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          {t.type === 'info'    && <Info          className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />}
          <p className="text-sm flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-current opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
