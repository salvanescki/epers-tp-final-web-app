import { useAuth } from '../auth/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { GhostLoader } from './GhostLoader'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Tipos de clases
export type PlayerClass = 'nightbringer' | 'lightbringer'

export const ClassSelector = () => {
  const { profile, logout, isExpired, isAuthenticated, selectedClass, setSelectedClass } = useAuth()
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !profile || isExpired) {
      // Asegurarnos de volver al login si se invalida
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, profile, isExpired, navigate])

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center scanlines overflow-hidden">
        <GhostLoader />
      </div>
    )
  }

  if (!profile || isExpired) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6 scanlines overflow-hidden">
        <p className="text-xs text-muted-foreground tracking-widest">Sesión expirada o inválida</p>
        <Link to="/" className="px-4 py-3 bg-primary text-primary-foreground text-[0.65rem] border-2 border-primary shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          VOLVER
        </Link>
      </div>
    )
  }

  const handleStart = () => {
    if (!selectedClass) {
      toast.error('Primero elige una clase para comenzar', {
        position: 'top-center',
        autoClose: 2500,
        closeOnClick: true,
        pauseOnHover: false,
        theme: 'dark',
        style: {
          fontFamily: 'Press Start 2P',
          fontSize: '10px',
          letterSpacing: '0.15em',
          background: 'oklch(0.18 0.03 10)',
          border: '2px solid oklch(0.45 0.15 10)',
          color: 'oklch(0.95 0.05 10)'
        }
      })
      return
    }
    setStarting(true)
    setTimeout(() => {
      setStarting(false)
      navigate('/game')
    }, 1200)
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 scanlines overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,70,80,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(180,70,80,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-xl text-primary pixel-title">SELECTOR DE CLASE</h1>
          <p className="text-[0.6rem] text-muted-foreground tracking-widest">{">"} ELIGE TU DESTINO {"<"}</p>
        </div>

        <div className="p-6 bg-card border-2 border-primary shadow-retro space-y-6">
          <div className="flex flex-col items-center gap-4">
            {profile.picture && (
              <img
                src={profile.picture}
                alt={profile.name}
                className="w-24 h-24 border-2 border-primary shadow-retro"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            <div className="space-y-1 text-center">
              <p className="text-xs text-muted-foreground tracking-widest">USUARIO:</p>
              <p className="text-primary text-xs truncate max-w-full">{profile.name}</p>
              <p className="text-[0.55rem] text-muted-foreground break-all">{profile.email}</p>
            </div>
          </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground tracking-widest">ELIGE TU CLASE:</p>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClass('nightbringer')}
                  className={`flex items-start gap-3 p-3 border-2 transition-all ${selectedClass === 'nightbringer' ? 'bg-primary/20 border-primary shadow-retro' : 'bg-muted border-border hover:border-primary'}`}
                >
                  <span className="text-lg">👻</span>
                  <div className="text-left">
                    <p className="text-[0.6rem] text-foreground mb-1">NIGHTBRINGER</p>
                    <p className="text-[0.55rem] text-muted-foreground leading-relaxed">Invoca espíritus en el mapa.</p>
                  </div>
                  {selectedClass === 'nightbringer' && <span className="ml-auto text-primary text-lg">👻</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClass('lightbringer')}
                  className={`flex items-start gap-3 p-3 border-2 transition-all ${selectedClass === 'lightbringer' ? 'bg-accent/20 border-accent shadow-retro' : 'bg-muted border-border hover:border-accent'}`}
                >
                  <span className="text-lg">⚔️</span>
                  <div className="text-left">
                    <p className="text-[0.6rem] text-foreground mb-1">LIGHTBRINGER</p>
                    <p className="text-[0.55rem] text-muted-foreground leading-relaxed">Purifica áreas malditas.</p>
                  </div>
                  {selectedClass === 'lightbringer' && <span className="ml-auto text-accent text-lg">⚔️</span>}
                </button>
              </div>
              <button
                disabled={starting}
                onClick={handleStart}
                className="w-full mt-2 bg-primary text-primary-foreground px-4 py-3 text-[0.65rem] border-2 border-primary shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? 'INICIANDO...' : 'INICIAR JUEGO'}
              </button>
            </div>

          <button
            onClick={logout}
            className="w-full bg-destructive text-destructive-foreground px-4 py-3 text-[0.65rem] border-2 border-destructive shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            CERRAR SESIÓN
          </button>
        </div>
        <p className="text-center text-[0.5rem] text-muted-foreground tracking-widest">{">"} THE LORDS OF THE STRINGS {"<"}</p>
      </div>
      <ToastContainer newestOnTop limit={3} />
    </div>
  )
}
