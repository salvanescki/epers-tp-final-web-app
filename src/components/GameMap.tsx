"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/useAuth"
import { MAP_ZONES } from "../data/MAP_ZONES"
import { spawnearEspiritu, getUbicaciones } from "../api/api.ts"
import { ProfileMenu } from "./ProfileMenu"
import "../styles/game-map.css"

export const GameMap = () => {
  const { selectedClass, nightBringerId, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<any | null>(null)
  const [nombreEspiritu, setNombreEspiritu] = useState("")
  const [zonesWithRealIds, setZonesWithRealIds] = useState(MAP_ZONES)

  // Estado de zoom/pan
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastPinchDistanceRef = useRef<number | null>(null)

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
    const loadUbicaciones = async () => {
      try {
        const ubicaciones = await getUbicaciones()
        const ubicacionesMap = new Map(ubicaciones.map((u: any) => [u.nombre, u.id]))
        
        const updatedZones = MAP_ZONES.map((zone) => {
          const realId = ubicacionesMap.get(zone.name)
          return realId ? { ...zone, id: realId } : zone
        })
        
        setZonesWithRealIds(updatedZones)
      } catch (error) {
        console.error("Error cargando ubicaciones:", error)
        // Si falla, usamos los IDs por defecto de MAP_ZONES
      }
    }
    loadUbicaciones()
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
    if (selectedClass !== "nightbringer") return
    setSelectedZone(zone)
    setNombreEspiritu("")
    setModalOpen(true)
  }

  const spawn = async () => {
    if (!nightBringerId) return alert("NightBringer no creado")
    try {
      await spawnearEspiritu(nightBringerId, selectedZone.id, nombreEspiritu || "Espíritu")
      setModalOpen(false)
    } catch (e) {
      console.error(e)
      alert("Error al spawnear")
    }
  }

  return (
    <div className="map-wrapper">
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
                className="zone"
                onClick={(e) => openModal(z, e)}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.w}%`,
                  height: `${z.h}%`,
                  transform: z.rotate ? `rotate(${z.rotate}deg)` : undefined,
                  transformOrigin: "center center",
                }}
              >
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
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-card/70 border border-border px-2 sm:px-3 py-1.5 sm:py-2 text-[0.45rem] sm:text-[0.55rem] tracking-widest pointer-events-none">
          {">"} CLASE: {selectedClass?.toUpperCase()} {"<"}
        </div>
      </div>

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
              className="bg-primary text-white px-3 py-2 text-xs sm:text-sm border-2 border-primary hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              SPAWNEAR
            </button>

            <button
              onClick={() => setModalOpen(false)}
              className="bg-destructive text-white px-3 py-2 text-xs sm:text-sm border-2 border-destructive hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
