import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'

// Componente principal del mapa de juego
// Usa el mapa SVG ubicado en /public/mapa.svg como fondo
export const GameMap = () => {
  const { profile, selectedClass, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const avatarRef = useRef<HTMLButtonElement | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)

  // estado de zoom/pan
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastTapRef = useRef<number | null>(null)
  const lastPinchDistanceRef = useRef<number | null>(null)

  // limita el desplazamiento para que siempre haya parte del mapa visible
  const clampOffset = (next: { x: number; y: number }) => {
    const container = mapRef.current
    if (!container) return next

    const vw = container.clientWidth
    const vh = container.clientHeight

    // relación de aspecto aproximada del mapa (ajustable si cambiara el SVG)
    const mapAspect = 16 / 9
    const viewportAspect = vw / vh

    // tamaño "virtual" del mapa según bg-contain y zoom
    let mapWidth: number
    let mapHeight: number
    if (viewportAspect > mapAspect) {
      // viewport más ancho que el mapa: altura llena, ancho se ajusta
      mapHeight = vh * scale
      mapWidth = mapHeight * mapAspect
    } else {
      // viewport más alto que el mapa: ancho llena, altura se ajusta
      mapWidth = vw * scale
      mapHeight = mapWidth / mapAspect
    }

    // siempre dejamos al menos una franja del mapa visible
    const visibleMarginX = vw * 0.4
    const visibleMarginY = vh * 0.4

    const maxX = Math.max(0, (mapWidth - visibleMarginX) / 2)
    const maxY = Math.max(0, (mapHeight - visibleMarginY) / 2)

    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    }
  }

  const applyZoom = (factor: number) => {
    setScale((prev) => {
      const next = Math.min(3, Math.max(0.7, prev * factor))
      return next
    })
  }

  // Redirigir si no hay clase elegida
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true })
      return
    }
    if (!selectedClass) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, selectedClass, navigate])

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null

      // ignorar clics sobre el avatar para que su onClick maneje el toggle
      if (avatarRef.current && target && avatarRef.current.contains(target)) {
        return
      }

      if (menuRef.current && !menuRef.current.contains(target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (!profile) {
    return null
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#222] text-foreground font-sans">
      {/* Lienzo del mapa con zoom/pan */}
      <div
        ref={mapRef}
        className="absolute inset-0 touch-pan-y touch-none cursor-grab active:cursor-grabbing"
        onWheel={(e) => {
          e.preventDefault()
          const delta = -e.deltaY
          const zoomFactor = delta > 0 ? 1.1 : 0.9
          applyZoom(zoomFactor)
        }}
        onMouseDown={(e) => {
          isPanningRef.current = true
          lastPosRef.current = { x: e.clientX, y: e.clientY }
        }}
        onMouseMove={(e) => {
          if (!isPanningRef.current) return
          const dx = e.clientX - lastPosRef.current.x
          const dy = e.clientY - lastPosRef.current.y
          lastPosRef.current = { x: e.clientX, y: e.clientY }
          setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }))
        }}
        onMouseUp={() => { isPanningRef.current = false }}
        onMouseLeave={() => { isPanningRef.current = false }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            // gesto de dos dedos para zoom
            const t1 = e.touches[0]
            const t2 = e.touches[1]
            const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
            lastPinchDistanceRef.current = distance
            isPanningRef.current = false
          } else if (e.touches.length === 1) {
            const t = e.touches[0]

            // doble toque para hacer zoom
            const now = Date.now()
            if (lastTapRef.current && now - lastTapRef.current < 300) {
              applyZoom(1.3)
              lastTapRef.current = null
              return
            }
            lastTapRef.current = now

            isPanningRef.current = true
            lastPosRef.current = { x: t.clientX, y: t.clientY }
            lastPinchDistanceRef.current = null
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
            // gesto de zoom con dos dedos
            const t1 = e.touches[0]
            const t2 = e.touches[1]
            const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
            const scaleFactor = distance / lastPinchDistanceRef.current
            applyZoom(scaleFactor)
            lastPinchDistanceRef.current = distance
            return
          }
          if (!isPanningRef.current || e.touches.length !== 1) return
          const t = e.touches[0]
          const dx = t.clientX - lastPosRef.current.x
          const dy = t.clientY - lastPosRef.current.y
          lastPosRef.current = { x: t.clientX, y: t.clientY }
          setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }))
        }}
        onTouchEnd={() => {
          isPanningRef.current = false
          lastPinchDistanceRef.current = null
        }}
      >
        <div
          className="w-full h-full bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: "url('/mapa.svg')",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* Overlay UI (avatar fijo y menú) */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {/* Avatar flotante arriba izquierda */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <button
            ref={avatarRef}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-14 h-14 rounded-full border-2 border-primary overflow-hidden shadow-retro bg-card hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            style={{ imageRendering: 'pixelated' }}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {profile.picture ? (
              <img src={profile.picture} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-xs text-primary">?</div>
            )}
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="mt-3 w-64 bg-card border-2 border-primary shadow-retro p-4 flex flex-col gap-3 text-[0.6rem]"
              role="menu"
            >
              <p className="text-primary truncate" title={profile.name}>{profile.name}</p>
              <p className="text-muted-foreground break-all" title={profile.email}>{profile.email}</p>
              <div className="border-t border-border pt-2 flex flex-col gap-1">
                <p className="text-xs text-muted-foreground tracking-widest">CLASE:</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-accent text-[0.65rem] font-bold">{selectedClass?.toUpperCase()}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/class')
                    }}
                    className="relative w-7 h-7 rounded-full border-2 border-accent flex items-center justify-center text-accent hover:bg-accent/10 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    title="Cambiar de clase"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="mt-1 bg-destructive text-destructive-foreground px-3 py-2 border-2 border-destructive shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                CERRAR SESIÓN
              </button>
            </div>
          )}
        </div>

        {/* Controles de zoom estilo Google Maps */}
        <div className="absolute bottom-8 right-4 pointer-events-auto flex flex-col bg-card border-2 border-primary shadow-retro">
          <button
            type="button"
            onClick={() => applyZoom(1.15)}
            className="w-10 h-10 flex items-center justify-center text-primary text-lg border-b border-primary hover:bg-primary/10"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(0.85)}
            className="w-10 h-10 flex items-center justify-center text-primary text-lg hover:bg-primary/10"
          >
            −
          </button>
        </div>

        {/* Texto de debug */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/70 border border-border px-3 py-2 text-[0.55rem] tracking-widest">
          {">"} MAPA DEMO - CLASE: {selectedClass?.toUpperCase()} {"<"}
        </div>
      </div>
    </div>
  )
}
