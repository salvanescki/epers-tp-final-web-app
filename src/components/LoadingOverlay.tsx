import { GhostLoader } from "./GhostLoader"

interface LoadingOverlayProps {
  show: boolean
  label?: string
}

export const LoadingOverlay = ({ show, label = "CARGANDO" }: LoadingOverlayProps) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border-2 border-primary shadow-retro px-8 py-10">
        <GhostLoader label={label} />
      </div>
    </div>
  )
}
