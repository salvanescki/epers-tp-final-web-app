import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export const ProfileMenu = () => {
  const { profile, selectedClass, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const avatarRef = useRef<HTMLButtonElement | null>(null)

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
    <div className="absolute top-4 left-4 pointer-events-auto z-20">
      <button
        ref={avatarRef}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-primary overflow-hidden shadow-retro bg-card hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
          className="mt-3 w-56 sm:w-64 bg-card border-2 border-primary shadow-retro p-3 sm:p-4 flex flex-col gap-3 text-[0.6rem]"
          role="menu"
        >
          <p className="text-primary truncate" title={profile.name}>{profile.name}</p>
          <p className="text-muted-foreground break-all text-[0.55rem]" title={profile.email}>{profile.email}</p>
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
            className="mt-1 bg-destructive text-destructive-foreground px-3 py-2 text-[0.6rem] border-2 border-destructive shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            CERRAR SESIÓN
          </button>
        </div>
      )}
    </div>
  )
}
