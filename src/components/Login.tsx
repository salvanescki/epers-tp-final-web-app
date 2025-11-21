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
      <div className='flex items-center justify-center min-h-screen scanlines relative px-4'>
        <GhostLoader />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen scanlines relative px-4 gap-6'>
        <GhostLoader label='REDIRIGIENDO...' />
        <p className='text-creepy-300 text-xs tracking-widest'>Sesión válida</p>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center min-h-screen scanlines relative px-4'>
      <div className='login-panel relative'>
        <div className='flex flex-col items-center gap-4'>
          <div className='ghost ghost-jump' />
          <h1 className='flicker-text text-xl'>GHOST WARS</h1>
          <p className='subtitle-glow'>SISTEMA INICIADO</p>
        </div>
        <div className='flex flex-col gap-4 mt-6'>
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
          <p className='text-xs text-creepy-300 leading-relaxed text-center'>
            Guardamos tu <span className='text-creepy-400'>ID Token</span> en el navegador. Expira automáticamente.
          </p>
        </div>
        <div className='mt-6 border-t border-[#3b0d0d] pt-6 flex flex-col gap-4'>
          <h3 className='text-creepy-400 text-xs tracking-[0.2em]'>CLASES DISPONIBLES:</h3>
          <div className='flex flex-col gap-3'>
            <div className='border border-[#3b0d0d] rounded-md p-4 flex items-start gap-3 hover:border-[#641a1a] transition'>
              <div className='ghost ghost-jump w-10 h-10' style={{ filter: 'drop-shadow(0 0 4px rgba(184,53,53,0.5))' }} />
              <div className='flex flex-col gap-1'>
                <span className='text-creepy-300 text-xs font-bold tracking-wide'>NIGHTBRINGER</span>
                <span className='text-[10px] text-creepy-200 leading-snug'>Invoca espíritus oscuros que generan eventos en el mapa.</span>
              </div>
            </div>
            <div className='border border-[#3b0d0d] rounded-md p-4 flex items-start gap-3 hover:border-[#641a1a] transition'>
              <div className='ghost w-10 h-10' style={{ filter: 'drop-shadow(0 0 4px rgba(209,79,79,0.5))' }} />
              <div className='flex flex-col gap-1'>
                <span className='text-creepy-300 text-xs font-bold tracking-wide'>LIGHTBRINGER</span>
                <span className='text-[10px] text-creepy-200 leading-snug'>Purifica áreas y debilita apariciones cerca de la luz.</span>
              </div>
            </div>
          </div>
          <p className='text-[10px] text-center text-creepy-300 tracking-widest'>&gt; PRESS START TO PLAY &lt;</p>
        </div>
      </div>
    </div>
  )
}
