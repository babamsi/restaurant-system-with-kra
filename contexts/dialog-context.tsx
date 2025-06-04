"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface DialogContextType {
  isAnyDialogOpen: boolean
  setDialogOpen: (isOpen: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isAnyDialogOpen, setIsAnyDialogOpen] = useState(false)

  const setDialogOpen = (isOpen: boolean) => {
    setIsAnyDialogOpen(isOpen)
  }

  return (
    <DialogContext.Provider value={{ isAnyDialogOpen, setDialogOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
