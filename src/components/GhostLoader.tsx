import React from 'react'
import { cn } from '../lib/utils'

export const GhostLoader: React.FC<{ className?: string; label?: string }> = ({ className, label = 'CARGANDO...' }) => {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className='ghost ghost-jump relative' />
      <p className='text-xs text-creepy-400 tracking-widest' style={{ animation: 'flicker 2.5s linear infinite' }}>{label}</p>
    </div>
  )
}
