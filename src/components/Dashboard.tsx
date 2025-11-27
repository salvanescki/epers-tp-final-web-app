import { useAuth } from '../auth/useAuth'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { recuperarNightBringer } from '../api/api'

export const Dashboard = () => {
  const { profile, logout, isExpired, nightBringerId, setNightBringerId } = useAuth()
  const [validatingNB, setValidatingNB] = useState(true)

  // Validar que el NightBringer todavía exista en el servidor
  useEffect(() => {
    const validateNightBringer = async () => {
      if (nightBringerId) {
        try {
          await recuperarNightBringer(nightBringerId)
          setValidatingNB(false)
        } catch (error: any) {
          console.error("NightBringer no encontrado en el servidor:", error)
          // Si devuelve 404, limpiar el localStorage
          if (error?.message?.includes("404")) {
            localStorage.removeItem("nightbringer_id")
            localStorage.removeItem("selected_player_class")
            setNightBringerId(null)
          }
          setValidatingNB(false)
        }
      } else {
        setValidatingNB(false)
      }
    }
    validateNightBringer()
  }, [nightBringerId, setNightBringerId])

  if (!profile || isExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 scanlines">
        <p className="text-xs text-muted-foreground tracking-widest">Sesión expirada o inválida</p>
        <Link to="/" className="px-4 py-3 bg-primary text-primary-foreground text-[0.65rem] border-2 border-primary shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          VOLVER
        </Link>
      </div>
    )
  }

  if (validatingNB) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 scanlines">
        <p className="text-xs text-muted-foreground tracking-widest">Validando NightBringer...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 scanlines">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,70,80,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(180,70,80,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      <div className="relative z-10 w-full max-w-md space-y-6 pt-12">
        <div className="text-center space-y-3">
          <h1 className="text-xl text-primary pixel-title">DASHBOARD</h1>
          <p className="text-[0.6rem] text-muted-foreground tracking-widest">{">"} SESIÓN ACTIVA {"<"}</p>
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

          <div className="grid gap-3 pt-4 border-t border-border">
            <div className="flex items-start gap-3 p-3 bg-muted border border-border">
              <span className="text-primary text-lg">👻</span>
              <div>
                <p className="text-[0.6rem] text-foreground mb-1">NIGHTBRINGER</p>
                <p className="text-[0.55rem] text-muted-foreground leading-relaxed">Invoca apariciones en el mapa.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted border border-border">
              <span className="text-accent text-lg">⚔️</span>
              <div>
                <p className="text-[0.6rem] text-foreground mb-1">LIGHTBRINGER</p>
                <p className="text-[0.55rem] text-muted-foreground leading-relaxed">Purifica áreas oscuras.</p>
              </div>
            </div>
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
    </div>
  )
}
