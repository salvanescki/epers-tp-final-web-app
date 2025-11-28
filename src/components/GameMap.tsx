"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/useAuth"
import { MAP_ZONES } from "../data/MAP_ZONES"
import { spawnearEspiritu, getUbicaciones, getEspiritusEnUbicacion } from "../api/api.ts"
import { ProfileMenu } from "./ProfileMenu"
import { LoadingOverlay } from "./LoadingOverlay"
import "../styles/game-map.css"

export const GameMap = () => {
  const { selectedClass, nightBringerId, isAuthenticated, setNightBringerId, setSelectedClass, profile } = useAuth()
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<any | null>(null)
  const [nombreEspiritu, setNombreEspiritu] = useState("")
  const [zonesWithRealIds, setZonesWithRealIds] = useState(MAP_ZONES)
  const [espiritusEnZonas, setEspiritusEnZonas] = useState<Map<number, any[]>>(new Map())
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [spawning, setSpawning] = useState(false)

  // Estado de zoom/pan
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastPinchDistanceRef = useRef<number | null>(null)

  const isNightBringer = selectedClass === "nightbringer"
  const isLightBringer = selectedClass === "lightbringer"
  const lightbringerThemeVars = isLightBringer
    ? ({
        "--background": "#0d0900",
        "--foreground": "#fff8d6",
        "--card": "#1a1403",
        "--card-foreground": "#fff7c2",
        "--primary": "#facc15",
        "--primary-foreground": "#1a1200",
        "--accent": "#fde047",
        "--accent-foreground": "#1a1200",
        "--destructive": "#facc15",
        "--destructive-foreground": "#1a1200",
        "--border": "#fcd34d",
        "--ring": "#facc15",
        "--muted-foreground": "#fde68a",
      } as React.CSSProperties)
    : undefined

  useEffect(() => {
    if (isLightBringer) {
      setInfoModalOpen(true)
    } else {
      setInfoModalOpen(false)
    }
  }, [isLightBringer])

  // Limita el desplazamiento para que siempre haya parte del mapa visible
  const clampOffset = (next: { x: number; y: number }) => {
    const container = mapRef.current
    if (!container) return next

    const vw = container.clientWidth
    const vh = container.clientHeight

    // Relación de aspecto del mapa: 16:10
    const mapAspect = 16 / 10
    const viewportAspect = vw / vh

    // Tamaño "virtual" del mapa según zoom
    let mapWidth: number
    let mapHeight: number
    if (viewportAspect > mapAspect) {
      mapHeight = vh * scale
      mapWidth = mapHeight * mapAspect
    } else {
      mapWidth = vw * scale
      mapHeight = mapWidth / mapAspect
    }

    // Siempre dejamos al menos una franja del mapa visible
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
      const next = Math.min(3, Math.max(0.5, prev * factor))
      return next
    })
  }

  // Cargar ubicaciones del backend y mapear IDs reales
  useEffect(() => {
    let isMounted = true
    const eventSources: EventSource[] = []

    const loadUbicaciones = async () => {
      try {
        const ubicaciones = await getUbicaciones()
        const ubicacionesMap = new Map(ubicaciones.map((u: any) => [u.nombre, u.id]))

        const updatedZones = MAP_ZONES.map((zone) => {
          const realId = ubicacionesMap.get(zone.name)
          return realId ? { ...zone, id: realId } : zone
        })

        if (isMounted) {
          setZonesWithRealIds(updatedZones)
        }

        const initialEspiritusMap = new Map<number, any[]>()
        await Promise.all(
          updatedZones.map(async (zone) => {
            if (!zone.id) return
            try {
              const espiritus = await getEspiritusEnUbicacion(zone.id)
              if (espiritus.length > 0) {
                initialEspiritusMap.set(zone.id, espiritus)
              }
            } catch (error) {
              console.error(`Error cargando espíritus de zona ${zone.id}:`, error)
            }
          })
        )

        if (isMounted) {
          setEspiritusEnZonas(initialEspiritusMap)
        }

        if (!isMounted) return

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

        updatedZones.forEach((zone) => {
          if (!zone.id || !isMounted) return

          const eventSource = new EventSource(`${baseUrl}/ubicacion/${zone.id}/stream`, {
            withCredentials: true,
          })

          eventSource.onopen = () => {
            console.log(`SSE conectado para ubicación ${zone.id}`)
          }

          eventSource.onmessage = (event) => {
            try {
              const espiritu = JSON.parse(event.data)
              console.log("Espíritu recibido via SSE:", espiritu)

              setEspiritusEnZonas((prev) => {
                const newMap = new Map(prev)
                const currentList = newMap.get(zone.id) || []

                const exists = currentList.some((e: any) => e.id === espiritu.id)
                if (!exists) {
                  newMap.set(zone.id, [...currentList, espiritu])
                }

                return newMap
              })
            } catch (error) {
              console.error("Error parseando mensaje SSE:", error)
            }
          }

          eventSource.onerror = () => {
            console.warn(`SSE desconectado para ubicación ${zone.id}`)
            if (eventSource.readyState === EventSource.CLOSED) {
              console.error(`Conexión SSE cerrada para ubicación ${zone.id}`)
            }
          }

          eventSources.push(eventSource)
        })
      } catch (error) {
        console.error("Error cargando ubicaciones:", error)
      } finally {
        if (isMounted) {
          setMapLoading(false)
        }
      }
    }

    loadUbicaciones()

    return () => {
      isMounted = false
      eventSources.forEach((es) => es.close())
    }
  }, [])

  // Redirigir si no hay clase elegida
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true })
      return
    }
    if (!selectedClass) {
      navigate("/dashboard", { replace: true })
    }
  }, [isAuthenticated, selectedClass, navigate])

  const openModal = (zone: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isNightBringer) return
    setSelectedZone(zone)
    setNombreEspiritu("")
    setModalOpen(true)
  }

  const spawn = async () => {
    if (!nightBringerId) {
      alert("NightBringer no creado. Ve al Dashboard para crear uno.")
      navigate("/dashboard")
      return
    }
    setSpawning(true)
    try {
      await spawnearEspiritu(nightBringerId, selectedZone.id, nombreEspiritu || "Espíritu")
      setModalOpen(false)
      // El SSE actualizará el badge automáticamente
      console.log(`Espíritu "${nombreEspiritu || "Espíritu"}" spawneado exitosamente!`)
    } catch (e: any) {
      console.error("Error al spawnear espíritu:", e)
      const errorMsg = e?.message || "Error desconocido"

      // Solo consideramos que el NightBringer no existe si el backend devuelve 404 con ese mensaje
      if (errorMsg.includes("Error 404") && errorMsg.toLowerCase().includes("nightbringer")) {
        alert("Tu NightBringer ya no existe en el servidor. Crea uno nuevo en el Dashboard.")
        // Limpiar usando los métodos del contexto y claves específicas por email
        setNightBringerId(null)
        setSelectedClass(null)
        if (profile?.email) {
          const userClassKey = `selected_player_class_${profile.email}`
          const userNBKey = `nightbringer_id_${profile.email}`
          localStorage.removeItem(userClassKey)
          localStorage.removeItem(userNBKey)
        }
        navigate("/dashboard")
      } else {
        // Cerramos el modal y dejamos registro en consola para no interrumpir la experiencia
        setModalOpen(false)
      }
    } finally {
      setSpawning(false)
    }
  }

  return (
    <div
      className={`map-wrapper ${isLightBringer ? "lightbringer-mode" : ""}`}
      style={lightbringerThemeVars}
    >
      <LoadingOverlay show={mapLoading} label="CARGANDO" />
      <div className="relative w-full h-screen overflow-hidden bg-background/80 text-foreground">
      {/* Lienzo del mapa con zoom/pan */}
      <div
        ref={mapRef}
        className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
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
        onMouseUp={() => {
          isPanningRef.current = false
        }}
        onMouseLeave={() => {
          isPanningRef.current = false
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            // Gesto de dos dedos para zoom
            const t1 = e.touches[0]
            const t2 = e.touches[1]
            const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
            lastPinchDistanceRef.current = distance
            isPanningRef.current = false
          } else if (e.touches.length === 1) {
            const t = e.touches[0]
            isPanningRef.current = true
            lastPosRef.current = { x: t.clientX, y: t.clientY }
            lastPinchDistanceRef.current = null
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
            // Gesto de zoom con dos dedos
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
        {/* Canvas del mapa controlado por CSS */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div className="map-canvas">
            {zonesWithRealIds.map((z) => (
              <div
                key={z.id}
                className={`zone ${!isNightBringer ? "zone-disabled" : ""}`}
                onClick={isNightBringer ? (e) => openModal(z, e) : undefined}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.w}%`,
                  height: `${z.h}%`,
                  transform: z.rotate ? `rotate(${z.rotate}deg)` : undefined,
                  transformOrigin: "center center",
                }}
              >
                {espiritusEnZonas.get(z.id)?.length ? (
                  <span className="espiritu-badge">
                    {`👻x${espiritusEnZonas.get(z.id)?.length}`}
                  </span>
                ) : null}
                <span className="zone-name" data-zone={z.name}>
                  {z.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay UI */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {/* Menu de perfil */}
        <ProfileMenu />

        {isLightBringer && (
          <button
            type="button"
            onClick={() => setInfoModalOpen(true)}
            className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto border-2 border-primary text-primary px-6 py-3 text-sm sm:text-base hover:bg-primary/20 transition-colors uppercase tracking-wider"
            style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }}
          >
            INSTRUCCIONES
          </button>
        )}

        {/* Controles de zoom */}
        <div className="absolute bottom-6 sm:bottom-8 right-3 sm:right-4 pointer-events-auto flex flex-col bg-card border-2 border-primary">
          <button
            type="button"
            onClick={() => applyZoom(1.15)}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-primary text-base sm:text-xl border-b border-primary hover:bg-primary/10 transition-colors select-none"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(0.85)}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-primary text-base sm:text-xl hover:bg-primary/10 transition-colors select-none"
          >
            −
          </button>
        </div>

        {/* Texto de info */}
        <div
          className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-card/70 border px-2 sm:px-3 py-1.5 sm:py-2 text-[0.45rem] sm:text-[0.55rem] tracking-widest pointer-events-none ${isLightBringer ? "border-primary text-primary" : "border-border"}`}
        >
          {">"} CLASE: {selectedClass?.toUpperCase()} {"<"}
        </div>
      </div>

      {isLightBringer && infoModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-[#111] border-2 border-primary p-5 sm:p-6 w-80 sm:w-96 flex flex-col gap-4 shadow-retro text-sm">
            <h2 className="text-primary text-center text-base">INSTRUCCIONES LIGHTBRINGER</h2>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">             
              ¡Las fuerzas de la luz te necesitan!<br></br>
              ¡No compartas este mensaje con nadie!<br></br>
              Cualquiera podria ser una entidad oscura…<br></br>
              En caso de necesitarlo, debes iluminar al medium poseido para purificar la oscuridad en el.<br></br>
              Tené preparado cualquier tipo de linterna a tu alcance.<br></br>
              Espera pacientemente a que llegue el momento de iluminar un medium.<br></br>
              Por ahora mantente sentado y observa, procura parecer uno mas de ellos…
            </p>
            <button
              onClick={() => setInfoModalOpen(false)}
              className="bg-primary text-primary-foreground px-3 py-2 text-xs sm:text-sm border-2 border-primary hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* Modal de spawn */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-[#111] border-2 border-primary p-4 sm:p-6 w-72 sm:w-80 flex flex-col gap-3 sm:gap-4 shadow-retro m-4">
            <h2 className="text-primary text-center text-sm sm:text-base">INVOCAR ESPÍRITU</h2>

            <p className="text-xs text-muted-foreground">
              Zona: <span className="text-primary">{selectedZone?.name}</span>
            </p>

            <input
              className="bg-card border border-primary/40 text-xs p-2"
              placeholder="Nombre del espíritu..."
              value={nombreEspiritu}
              onChange={(e) => setNombreEspiritu(e.target.value)}
            />

            <button
              onClick={spawn}
              disabled={spawning}
              className="bg-primary text-white px-3 py-2 text-xs sm:text-sm border-2 border-primary hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {spawning ? "SPAWNEANDO..." : "SPAWNEAR"}
            </button>

            <button
              onClick={() => setModalOpen(false)}
              disabled={spawning}
              className="bg-destructive text-white px-3 py-2 text-xs sm:text-sm border-2 border-destructive hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CANCELAR
            </button>

            {spawning && (
              <div className="flex items-center gap-2 text-[0.6rem] text-primary">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>Invocando espíritu...</span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
