import React from 'react'
import { cn } from '../lib/utils'

interface GhostLoaderProps {
  className?: string
  label?: string
}

export const GhostLoader: React.FC<GhostLoaderProps> = ({ className, label = 'CARGANDO...' }) => {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative w-16 h-16">
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full animate-bounce text-primary"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Cuerpo fantasmal pixelado */}
          <rect x="8" y="6" width="16" height="2" fill="currentColor" />
          <rect x="6" y="8" width="20" height="2" fill="currentColor" />
            <rect x="4" y="10" width="24" height="12" fill="currentColor" />
          {/* Base ondulada */}
          <rect x="4" y="22" width="4" height="2" fill="currentColor" />
          <rect x="12" y="22" width="4" height="2" fill="currentColor" />
          <rect x="20" y="22" width="4" height="2" fill="currentColor" />
          <rect x="8" y="24" width="4" height="2" fill="currentColor" />
          <rect x="16" y="24" width="4" height="2" fill="currentColor" />
          <rect x="24" y="24" width="4" height="2" fill="currentColor" />
          {/* Ojos */}
          <rect x="10" y="12" width="3" height="3" fill="oklch(0.12 0.02 270)" />
          <rect x="19" y="12" width="3" height="3" fill="oklch(0.12 0.02 270)" />
        </svg>
      </div>
      <p className="text-xs text-primary animate-pulse tracking-widest">{label}</p>
    </div>
  )
}
