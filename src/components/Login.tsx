import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../auth/useAuth'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GhostLoader } from './GhostLoader'

export const Login = () => {
  const { login, isAuthenticated, initialized } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (initialized && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [initialized, isAuthenticated, navigate])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center scanlines">
        <GhostLoader />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center scanlines gap-6">
        <GhostLoader label="REDIRIGIENDO..." />
        <p className="text-xs text-muted-foreground tracking-widest">Sesión válida</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 scanlines">
      {/* Fondo grid retro */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,70,80,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(180,70,80,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Título */}
        <div className="text-center space-y-4">
          <div className="inline-block">
            <h1 className="text-2xl text-primary mb-2 pixel-title">GHOST WARS</h1>
            <div className="h-1 bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground tracking-widest">{">"} THE LORDS OF THE STRINGS</p>
        </div>

        {/* Tarjeta Login simplificada sin listado de clases */}
        <div className="p-6 bg-card border-2 border-primary shadow-retro space-y-5">
          <p className="text-xs text-muted-foreground tracking-widest">AUTENTICACIÓN REQUERIDA:</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(response) => {
                const cred = (response as any)?.credential
                if (cred) {
                  login(cred)
                }
              }}
              onError={() => {
                // eslint-disable-next-line no-console
                console.error('Error al iniciar sesión con Google')
              }}
              useOneTap
            />
          </div>
          <p className="text-[0.65rem] text-muted-foreground leading-relaxed text-center">
            Guardamos tu <span className="text-primary">ID Token</span> localmente. Expira automáticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
