import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'
import { useUbicacionStreams } from '../lib/useUbicacionStreams'
import { SpiritSpawnModal } from './SpiritSpawnModal'
import { SpiritMarker } from './SpiritMarker'

// Componente principal del mapa de juego
// Usa el mapa SVG ubicado en /public/mapa.svg como fondo
export const GameMap = () => {
  const { profile, selectedClass, logout, isAuthenticated, credential } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const avatarRef = useRef<HTMLButtonElement | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  // estado de zoom/pan
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [espiritus, setEspiritus] = useState<Array<any>>([])
  // locations will include a set of coordinates (lat, lng) and we compute bounds from them
  const [locations, setLocations] = useState<Array<{ id: number | string, name?: string, coordenadas?: Array<{ latitud: number, longitud: number }>, bounds?: { minLat: number, maxLat: number, minLng: number, maxLng: number } }>>([])
  const [activeLocationId, setActiveLocationId] = useState<string | number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [myNightBringerId, setMyNightBringerId] = useState<number | null>(null)
  const [globalBounds, setGlobalBounds] = useState<{ minLat: number, maxLat: number, minLng: number, maxLng: number } | null>(null)
  const [clickPos, setClickPos] = useState<{ x: number, y: number } | null>(null)
  const isPanningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastTapRef = useRef<number | null>(null)
  const lastPinchDistanceRef = useRef<number | null>(null)

  // limita el desplazamiento para que siempre haya parte del mapa visible
  const clampOffset = (next: { x: number; y: number }) => {
    const container = mapRef.current
    if (!container) return next

    const vw = container.clientWidth
    const vh = container.clientHeight

    // relación de aspecto aproximada del mapa (ajustable si cambiara el SVG)
    const mapAspect = 16 / 9
    const viewportAspect = vw / vh

    // tamaño "virtual" del mapa según bg-contain y zoom
    let mapWidth: number
    let mapHeight: number
    if (viewportAspect > mapAspect) {
      // viewport más ancho que el mapa: altura llena, ancho se ajusta
      mapHeight = vh * scale
      mapWidth = mapHeight * mapAspect
    } else {
      // viewport más alto que el mapa: ancho llena, altura se ajusta
      mapWidth = vw * scale
      mapHeight = mapWidth / mapAspect
    }

    // siempre dejamos al menos una franja del mapa visible
    const visibleMarginX = vw * 0.4
    const visibleMarginY = vh * 0.4

    const maxX = Math.max(0, (mapWidth - visibleMarginX) / 2)
    const maxY = Math.max(0, (mapHeight - visibleMarginY) / 2)

    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    }
  }

  const applyZoom = (factor: number) => {
    setScale((prev) => {
      const next = Math.min(3, Math.max(0.7, prev * factor))
      return next
    })
  }

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

  // Fetch available ubicaciones once and subscribe
  useEffect(() => {
    apiFetch('/ubicacion')
      .then((r) => r.json())
      .then((list) => {
        // Convert returned DTO into a shape with `coordenadas` and derived bounds
        const parsed = (list || []).map((l: any) => {
          const coords = (l.coordenadas || []).map((c: any) => ({ latitud: c.latitud ?? c.latitude ?? c.lat, longitud: c.longitud ?? c.longitude ?? c.lng }))
          let minLat = Number.POSITIVE_INFINITY
          let maxLat = Number.NEGATIVE_INFINITY
          let minLng = Number.POSITIVE_INFINITY
          let maxLng = Number.NEGATIVE_INFINITY
          coords.forEach((c: { latitud: number, longitud: number}) => {
            minLat = Math.min(minLat, c.latitud)
            maxLat = Math.max(maxLat, c.latitud)
            minLng = Math.min(minLng, c.longitud)
            maxLng = Math.max(maxLng, c.longitud)
          })
          const bounds = { minLat, maxLat, minLng, maxLng }
          return { ...l, coordenadas: coords, bounds }
        })
        setLocations(parsed)
        if (parsed && parsed.length > 0) {
          setActiveLocationId(parsed[0].id)
        }

        // compute global bounds for the entire map using all coords
        let gMinLat = Number.POSITIVE_INFINITY, gMaxLat = Number.NEGATIVE_INFINITY, gMinLng = Number.POSITIVE_INFINITY, gMaxLng = Number.NEGATIVE_INFINITY
        parsed.forEach((pl: any) => {
          if (!pl.coordenadas) return
          pl.coordenadas.forEach((c: any) => {
            gMinLat = Math.min(gMinLat, c.latitud)
            gMaxLat = Math.max(gMaxLat, c.latitud)
            gMinLng = Math.min(gMinLng, c.longitud)
            gMaxLng = Math.max(gMaxLng, c.longitud)
          })
        })
        if (gMinLat !== Number.POSITIVE_INFINITY) {
          setGlobalBounds({ minLat: gMinLat, maxLat: gMaxLat, minLng: gMinLng, maxLng: gMaxLng })
        }
      })
      .catch((err) => {
        // If the endpoint differs, user can override base url or handle errors
        console.warn('No se pudieron obtener ubicaciones', err)
      })
  }, [])

  // Find current user's NightBringer ID (fetch and match by name; create if not exists)
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL ?? ''
    if (!profile?.email) return
    apiFetch('/nightBringer')
      .then((r) => r.json())
      .then((list) => {
        const nameToMatch = profile.name || profile.email || ''
        let match = list.find((n: any) => n.nombre === nameToMatch)
        if (!match) {
          // try matching if created with email as name
          match = list.find((n: any) => n.nombre === profile.email)
        }
        if (match) {
          setMyNightBringerId(match.id)
          return
        }
        // If not found, create a NightBringer with the profile name
        const body = { nombre: nameToMatch }
        fetch(`${base}/nightBringer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: `Bearer ${credential}` } : {}) },
          body: JSON.stringify(body),
        }).then(async (r) => {
          if (!r.ok) {
            console.warn('No se pudo crear NightBringer', await r.text())
            return
          }
          const created = await r.json()
          setMyNightBringerId(created.id)
        }).catch((err) => {
          console.warn('Error creating nightbringer', err)
        })
      })
      .catch((err) => console.warn('No se pudo obtener nightBringer list', err))
  }, [profile])

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

  // Helper to convert lat/lng <-> normalized x/y within the global bounds
  const latLngToNormalized = (lat: number, lng: number) => {
    if (!globalBounds) return { x: 0.5, y: 0.5 }
    const { minLat, maxLat, minLng, maxLng } = globalBounds
    const denomLng = (maxLng - minLng) || 1
    const denomLat = (maxLat - minLat) || 1
    const x = (lng - minLng) / denomLng
    // invert Y because DOM y grows downward
    const y = 1 - (lat - minLat) / denomLat
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
  }

  const normalizedToLatLng = (x: number, y: number) => {
    if (!globalBounds) return { lat: 0, lng: 0 }
    const { minLat, maxLat, minLng, maxLng } = globalBounds
    const lng = minLng + x * (maxLng - minLng)
    const lat = maxLat - y * (maxLat - minLat)
    return { lat, lng }
  }

  // Subscribe to ubicacion streams for all locations available
  useUbicacionStreams({
    ubicacionIds: locations.map((l) => String(l.id)),
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    token: credential ?? null,
    onMessage: (ubicacionId, data) => {
      // El backend debería enviar el espiritu creado con { id, name, x, y, ubicacionId }
      const parsed = typeof data === 'string' ? (() => {
        try { return JSON.parse(data) } catch { return data }
      })() : data

      // append to spirits list; attempt to normalize position if lat/long fields
      setEspiritus((prev) => {
        // If backend returns array, merge it
        if (Array.isArray(parsed)) {
          const arr = parsed.map((it: any) => ({ ...it, ubicacionId }))
          return [...prev, ...arr]
        }
        return [...prev, { ...parsed, ubicacionId }]
      })
    }
  })

  if (!profile) {
    return null
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#222] text-foreground font-sans">
      {/* Lienzo del mapa con zoom/pan */}
      <div
        ref={mapRef}
        className="absolute inset-0 touch-pan-y touch-none cursor-grab active:cursor-grabbing"
        onWheel={(e) => {
          e.preventDefault()
          const delta = -e.deltaY
          const zoomFactor = delta > 0 ? 1.1 : 0.9
          applyZoom(zoomFactor)
        }}
        onMouseDown={(e) => {
          isPanningRef.current = true
          lastPosRef.current = { x: e.clientX, y: e.clientY }
        }}
        onMouseMove={(e) => {
          if (!isPanningRef.current) return
          const dx = e.clientX - lastPosRef.current.x
          const dy = e.clientY - lastPosRef.current.y
          lastPosRef.current = { x: e.clientX, y: e.clientY }
          setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }))
        }}
        onMouseUp={() => { isPanningRef.current = false }}
        onMouseLeave={() => { isPanningRef.current = false }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            // gesto de dos dedos para zoom
            const t1 = e.touches[0]
            const t2 = e.touches[1]
            const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
            lastPinchDistanceRef.current = distance
            isPanningRef.current = false
          } else if (e.touches.length === 1) {
            const t = e.touches[0]

            // doble toque para hacer zoom
            const now = Date.now()
            if (lastTapRef.current && now - lastTapRef.current < 300) {
              applyZoom(1.3)
              lastTapRef.current = null
              return
            }
            lastTapRef.current = now

            isPanningRef.current = true
            lastPosRef.current = { x: t.clientX, y: t.clientY }
            lastPinchDistanceRef.current = null
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
            // gesto de zoom con dos dedos
            const t1 = e.touches[0]
            const t2 = e.touches[1]
            const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
            const scaleFactor = distance / lastPinchDistanceRef.current
            applyZoom(scaleFactor)
            lastPinchDistanceRef.current = distance
            return
          }
          if (!isPanningRef.current || e.touches.length !== 1) return
          const t = e.touches[0]
          const dx = t.clientX - lastPosRef.current.x
          const dy = t.clientY - lastPosRef.current.y
          lastPosRef.current = { x: t.clientX, y: t.clientY }
          setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }))
        }}
        onTouchEnd={() => {
          isPanningRef.current = false
          lastPinchDistanceRef.current = null
        }}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full bg-center bg-no-repeat bg-contain relative"
          style={{
            backgroundImage: "url('/mapa.svg')",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onClick={(e) => {
            // Click spawning flow: only nightbringer can spawn
            if (selectedClass !== 'nightbringer') return
            const containerRect = mapContainerRef.current?.getBoundingClientRect()
            if (!containerRect) return
            const x = (e.clientX - containerRect.left) / containerRect.width
            const y = (e.clientY - containerRect.top) / containerRect.height
            // Convert click to lat/lng using global bounds
            const { lat, lng } = normalizedToLatLng(x, y)
            // Find location that contains this coords using bounds
            const found = locations.find((l) => {
              if (!l.bounds) return false
              return lat >= l.bounds.minLat && lat <= l.bounds.maxLat && lng >= l.bounds.minLng && lng <= l.bounds.maxLng
            })
            if (!found) {
              // If click is not inside a defined location, ignore
              return
            }
            setActiveLocationId(found.id)
            setClickPos({ x, y })
            setModalOpen(true)
          }}
        >
          {/* Spirit markers are rendered inside the map container so they naturally scale */}
          {espiritus.filter(s => String(s.ubicacionId) === String(activeLocationId)).map((s) => {
            const lat = s?.coordenada?.latitud ?? s.latitud ?? s.latitude ?? s?.coordenada?.lat
            const lng = s?.coordenada?.longitud ?? s.longitud ?? s.longitude ?? s?.coordenada?.lng
            const { x: sx, y: sy } = latLngToNormalized(lat ?? 0, lng ?? 0)
            return <SpiritMarker key={s.id} id={s.id} name={s.name} x={sx} y={sy} />
          })}
        </div>
      </div>

      {/* Overlay UI (avatar fijo y menú) */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {/* Avatar flotante arriba izquierda */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <button
            ref={avatarRef}
            onClick={() => setMenuOpen((prev) => !prev)}
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
                className="mt-1 bg-destructive text-destructive-foreground px-3 py-2 border-2 border-destructive shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                CERRAR SESIÓN
              </button>
            </div>
          )}
        </div>

        {/* Controles de zoom estilo Google Maps */}
        <div className="absolute bottom-8 right-4 pointer-events-auto flex flex-col bg-card border-2 border-primary shadow-retro">
          <button
            type="button"
            onClick={() => applyZoom(1.15)}
            className="w-10 h-10 flex items-center justify-center text-primary text-lg border-b border-primary hover:bg-primary/10"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(0.85)}
            className="w-10 h-10 flex items-center justify-center text-primary text-lg hover:bg-primary/10"
          >
            −
          </button>
        </div>

        {/* Texto de debug */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/70 border border-border px-3 py-2 text-[0.55rem] tracking-widest">
          {">"} MAPA DEMO - CLASE: {selectedClass?.toUpperCase()} {"<"}
        </div>
        {/* Selector de ubicacion pequeno */}
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <select
            value={String(activeLocationId ?? '')}
            onChange={(e) => setActiveLocationId(e.target.value)}
            className="text-xs bg-card border-2 border-primary px-2 py-1"
          >
            {locations.length === 0 ? (
              <option value="">Cargando ubicaciones...</option>
            ) : (
              locations.map((loc) => (
                <option key={String(loc.id)} value={String(loc.id)}>{loc.name ?? `Ubicacion ${loc.id}`}</option>
              ))
            )}
          </select>
        </div>
      </div>
      {/* Modal to spawn spirit */}
      <SpiritSpawnModal
        open={modalOpen}
        initialName={''}
        onClose={() => { setModalOpen(false); setClickPos(null) }}
        onSubmit={(name) => {
          const ubicacion = activeLocationId
          if (!ubicacion) return
          // If we have myNightBringerId and user is nightbringer, call the special PATCH endpoint
          const shouldUseNightbringerEndpoint = selectedClass === 'nightbringer' && !!myNightBringerId
          if (shouldUseNightbringerEndpoint) {
            const id = myNightBringerId as number
            const safeName = encodeURIComponent(name)
            apiFetch(`/nightBringer/${id}/spawnearEspirituEnUbicacion/${safeName}/${ubicacion}`, {
              method: 'PATCH',
            }).then(async (r) => {
              if (!r.ok) {
                console.error('NightBringer spawn failed', await r.text())
                setModalOpen(false)
                setClickPos(null)
                return
              }
              try {
                const created = await r.json()
                setEspiritus((prev) => [...prev, { ...created, ubicacionId: String(ubicacion) }])
              } catch {
                // ignore parsing
              }
              setModalOpen(false)
              setClickPos(null)
            }).catch((err) => {
              console.error('Error spawning spirit', err)
              setModalOpen(false)
              setClickPos(null)
            })
            return
          }

          // Otherwise fallback to basic POST endpoint
          const body: any = { nombre: name, tipo: 'DEMONIO', nivelDeConexion: 1, ubicacionId: Number(ubicacion) }
          if (clickPos) { const { lat, lng } = normalizedToLatLng(clickPos.x, clickPos.y); body.latitud = lat; body.longitud = lng }
          apiFetch(`/ubicacion/${ubicacion}/espiritus`, {
            method: 'POST',
            body: JSON.stringify(body),
          }).then(async (r) => {
            if (!r.ok) {
              const txt = await r.text()
              console.error('Spawn failed', txt)
              setModalOpen(false)
              setClickPos(null)
              return
            }
            // If backend returns created spirit, we can optimistically append
            try {
              const created = await r.json()
              setEspiritus((prev) => [...prev, { ...created, ubicacionId: String(ubicacion) }])
            } catch {
              // ignore parsing
            }
            setModalOpen(false)
            setClickPos(null)
          }).catch((err) => {
            console.error('Error spawning spirit', err)
            setModalOpen(false)
            setClickPos(null)
          })
        }}
      />
    </div>
  )
}
