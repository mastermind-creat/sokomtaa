import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<{
  onOpenChange?: (open: boolean) => void
}>({})

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <AnimatePresence>
        {open && children}
      </AnimatePresence>
    </DialogContext.Provider>
  )
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const { onOpenChange } = React.useContext(DialogContext)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onOpenChange?.(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative z-[101] w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-3xl ${className}`}
      >
        <button 
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 z-10 p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <X size={20} />
        </button>
        {children}
      </motion.div>
    </div>
  )
}

export function DialogHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
}
