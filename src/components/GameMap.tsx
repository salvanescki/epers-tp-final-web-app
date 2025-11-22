import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'

// Componente principal del mapa de juego
// Usa una imagen de fondo (agregar en /public/game-map-bg.png o ajustar ruta)
export const GameMap = () => {
  const { profile, selectedClass, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
      {/* Fondo del mapa */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: "url('/game-map-bg.png')" }}
      />

      {/* Overlay UI */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {/* Avatar flotante arriba izquierda */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <button
            onClick={() => setMenuOpen((o) => !o)}
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
                <p className="text-accent text-[0.65rem] font-bold">{selectedClass?.toUpperCase()}</p>
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

        {/* Texto de debug */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/70 border border-border px-3 py-2 text-[0.55rem] tracking-widest">
          {">"} MAPA DEMO - CLASE: {selectedClass?.toUpperCase()} {"<"}
        </div>
      </div>
    </div>
  )
}
