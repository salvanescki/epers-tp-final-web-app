import React, { useEffect, useState } from 'react'
import { getApiErrors } from '../lib/api'

export const DebugOverlay: React.FC = () => {
  const [clientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '')
  const [apiBase] = useState(import.meta.env.VITE_API_BASE_URL ?? '')
  const [errors, setErrors] = useState<Array<any>>([])

  useEffect(() => {
    const id = setInterval(() => {
      setErrors(getApiErrors())
    }, 500)
    return () => clearInterval(id)
  }, [])

  if (!import.meta.env.DEV && !(import.meta.env.VITE_DEBUG === 'true')) return null

  return (
    <div style={{ position: 'fixed', right: 8, top: 8, zIndex: 99999, width: 320 }}>
      <div className="bg-card border-2 border-primary p-2 text-xs text-muted-foreground">
        <div className="text-xs text-muted-foreground">Debug overlay</div>
        <div className="text-[10px] mt-2">Origin: <span className="text-primary">{window.location.origin}</span></div>
        <div className="text-[10px]">API Base: <span className="text-primary">{apiBase || '(empty)'}</span></div>
        <div className="text-[10px]">Google ClientId: <span className="text-primary">{clientId || '(empty)'}</span></div>
        <div className="text-[10px] mt-2">Last errors:</div>
        <div className="max-h-40 overflow-auto mt-1 text-[10px]">
          {errors.length === 0 ? <div className="text-[11px] text-muted-foreground">No errors</div> : null}
          {errors.slice().reverse().map((e, idx) => (
            <div key={idx} className="mb-1 border-t border-border pt-1">
              <div className="font-bold">{e.status} {e.statusText}</div>
              <div>{e.url}</div>
              <div className="text-[11px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</div>
              {e.text ? <div className="text-[10px] break-words">{e.text.slice(0,200)}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
