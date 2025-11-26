import React from 'react'

interface SpiritMarkerProps {
  id: string | number
  name: string
  x: number // normalized 0..1
  y: number // normalized 0..1
  size?: number
}

export const SpiritMarker: React.FC<SpiritMarkerProps> = ({ id, name, x, y, size = 28 }) => {
  // The container placing the marker will translate these coordinates into px
  return (
    <div
      className="absolute pointer-events-auto z-20"
      data-espiritu-id={id}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -100%)' // center bottom
      }}
      title={name}
    >
      <div className="w-full h-full flex items-center justify-center text-lg" style={{ fontSize: '18px' }}>
        👻
      </div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] px-1 bg-card border-border text-card-foreground rounded-md whitespace-nowrap">
        {name}
      </div>
    </div>
  )
}
