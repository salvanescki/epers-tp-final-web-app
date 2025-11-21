import { useCallback, useEffect, useState } from 'react'
import { GoogleLogin, googleLogout } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import './App.css'

interface GoogleJwtPayload {
  name?: string
  picture?: string
  email?: string
}

const LOCAL_KEY = 'google_credential'

function App() {
  const [credential, setCredential] = useState<string | null>(null)
  const [profile, setProfile] = useState<GoogleJwtPayload | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) {
      setCredential(stored)
      try {
        setProfile(jwtDecode<GoogleJwtPayload>(stored))
      } catch {
        // token inválido, limpiar
        localStorage.removeItem(LOCAL_KEY)
      }
    }
  }, [])

  const handleSuccess = useCallback((response: any) => {
    const cred = response?.credential
    if (cred) {
      localStorage.setItem(LOCAL_KEY, cred)
      setCredential(cred)
      try {
        setProfile(jwtDecode<GoogleJwtPayload>(cred))
      } catch {
        setProfile(null)
      }
    }
  }, [])

  const handleLogout = useCallback(() => {
    googleLogout()
    localStorage.removeItem(LOCAL_KEY)
    setCredential(null)
    setProfile(null)
  }, [])

  if (!credential || !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '4rem' }}>
        <h2>Iniciar sesión</h2>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            // eslint-disable-next-line no-console
            console.error('Error al iniciar sesión con Google')
          }}
          useOneTap
        />
        <small style={{ maxWidth: 380, textAlign: 'center' }}>
          Al continuar aceptas usar tu cuenta de Google (solo se almacena el token en tu navegador).
        </small>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
      <img src={profile.picture} alt={profile.name} style={{ width: 96, borderRadius: '50%' }} />
      <h2>Bienvenido {profile.name}</h2>
      <p style={{ color: '#555' }}>{profile.email}</p>
      <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Cerrar sesión</button>
    </div>
  )
}

export default App
