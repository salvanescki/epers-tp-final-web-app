import React, { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  initialName?: string
}

export const SpiritSpawnModal: React.FC<Props> = ({ open, onClose, onSubmit, initialName = '' }) => {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, initialName])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-card border-2 border-primary p-4">
        <h2 className="text-xs text-muted-foreground tracking-widest mb-2">INVOCAR ESPÍRITU</h2>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del espíritu"
          className="w-full p-2 bg-muted border border-border text-xs"
        />
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={onClose} className="px-3 py-2 border-2 border-primary text-xs">CANCELAR</button>
          <button onClick={() => { if (name.trim()) onSubmit(name.trim()) }} className="px-3 py-2 bg-primary text-primary-foreground border-2 border-primary text-xs">INVOCAR</button>
        </div>
      </div>
    </div>
  )
}
