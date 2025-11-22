import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { googleLogout } from '@react-oauth/google'

interface GoogleJwtPayload {
  name?: string
  picture?: string
  email?: string
  exp?: number // seconds since epoch
}

interface AuthContextValue {
  credential: string | null
  profile: GoogleJwtPayload | null
  isAuthenticated: boolean
  isExpired: boolean
  initialized: boolean
  selectedClass: string | null
  setSelectedClass: (cls: string | null) => void
  login: (credential: string) => void
  logout: () => void
}

const LOCAL_KEY = 'google_credential'
const LOCAL_CLASS_KEY = 'selected_player_class'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [credential, setCredential] = useState<string | null>(null)
  const [profile, setProfile] = useState<GoogleJwtPayload | null>(null)
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const [selectedClass, setSelectedClassState] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const [initialized, setInitialized] = useState(false)

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const evaluateExpiration = useCallback((payload: GoogleJwtPayload | null) => {
    if (!payload?.exp) {
      setIsExpired(true)
      return
    }
    const nowSec = Math.floor(Date.now() / 1000)
    const remaining = payload.exp - nowSec
    if (remaining <= 0) {
      setIsExpired(true)
      return
    }
    setIsExpired(false)
    clearTimer()
    // schedule logout slightly after expiration
    timeoutRef.current = window.setTimeout(() => {
      setIsExpired(true)
      logout()
    }, remaining * 1000)
  }, [])

  const logout = useCallback(() => {
    clearTimer()
    googleLogout()
    localStorage.removeItem(LOCAL_KEY)
    localStorage.removeItem(LOCAL_CLASS_KEY)
    setCredential(null)
    setProfile(null)
    setSelectedClassState(null)
    setIsExpired(false)
  }, [])

  const login = useCallback((cred: string) => {
    localStorage.setItem(LOCAL_KEY, cred)
    setCredential(cred)
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(cred)
      setProfile(decoded)
      evaluateExpiration(decoded)
    } catch {
      setProfile(null)
      logout()
    }
  }, [evaluateExpiration, logout])

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) {
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(stored)
        const nowSec = Math.floor(Date.now() / 1000)
        if (decoded.exp && decoded.exp > nowSec) {
          setCredential(stored)
          setProfile(decoded)
          evaluateExpiration(decoded)
        } else {
          logout()
        }
      } catch {
        logout()
      }
    }
    const storedClass = localStorage.getItem(LOCAL_CLASS_KEY)
    if (storedClass) {
      setSelectedClassState(storedClass)
    }
    setInitialized(true)
    return () => clearTimer()
  }, [evaluateExpiration, logout])

  const setSelectedClass = useCallback((cls: string | null) => {
    setSelectedClassState(cls)
    if (cls) {
      localStorage.setItem(LOCAL_CLASS_KEY, cls)
    } else {
      localStorage.removeItem(LOCAL_CLASS_KEY)
    }
  }, [])

  const value: AuthContextValue = useMemo(() => ({
    credential,
    profile,
    isAuthenticated: !!credential && !!profile && !isExpired,
    isExpired,
    initialized,
    selectedClass,
    setSelectedClass,
    login,
    logout,
  }), [credential, profile, isExpired, initialized, selectedClass, setSelectedClass, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  return ctx
}
