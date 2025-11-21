import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { ReactNode } from 'react'
import { GhostLoader } from '../components/GhostLoader'

interface Props {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, initialized } = useAuth()
  if (!initialized) {
    return (
      <div className='flex items-center justify-center min-h-screen scanlines'>
        <GhostLoader label='CARGANDO...' />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to='/' replace />
  }
  return <>{children}</>
}
