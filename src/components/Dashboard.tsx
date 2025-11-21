import { useAuth } from '../auth/useAuth'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export const Dashboard = () => {
  const { profile, logout, isExpired } = useAuth()

  if (!profile || isExpired) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen gap-4 px-4'>
        <p className='text-creepy-300 text-sm'>Sesión expirada o inválida.</p>
        <Link to='/' className='btn-creepy text-xs'>Volver a Login</Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center min-h-screen pt-16 gap-6 px-4'>
      <div className='w-full max-w-md login-panel'>
        <div className='flex flex-col items-center gap-4'>
          {profile.picture && (
            <img
              src={profile.picture}
              alt={profile.name}
              className='rounded-full w-24 h-24 border border-creepy-700 shadow-[0_0_12px_rgba(209,79,79,0.4)]'
            />
          )}
          <h2 className='flicker-text text-lg'>Bienvenido</h2>
          <p className='text-creepy-200 text-xs tracking-wide'>{profile.name}</p>
          <p className='text-creepy-300 text-xs'>{profile.email}</p>
        </div>
        <div className='mt-6 flex justify-center'>
          <button onClick={logout} className={cn('btn-creepy text-xs')}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  )
}
