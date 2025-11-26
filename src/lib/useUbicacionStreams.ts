import { useEffect, useRef } from 'react'

// Hook to open one EventSource per id and call onMessage when a new message is received.
// Usage: useUbicacionStreams({ ubicacionIds: ['1','2'], onMessage: (ubicacionId, data) => {} })

interface UseUbicacionStreamsOptions {
  ubicacionIds: (string | number)[]
  onMessage: (ubicacionId: string, data: any) => void
  baseUrl?: string
  token?: string | null
}

export function useUbicacionStreams({ ubicacionIds, onMessage, baseUrl = '', token = null }: UseUbicacionStreamsOptions) {
  const sourcesRef = useRef<Record<string, EventSource | null>>({})

  useEffect(() => {
    // Helper to create event source for a specific id
    const createSource = (id: string) => {
      try {
            let url = `${baseUrl}/ubicacion/${id}/stream`
            if (token) {
              // add token query param because EventSource can't set headers
              const sep = url.includes('?') ? '&' : '?'
              url = `${url}${sep}token=${encodeURIComponent(token)}`
            }
        const es = new EventSource(url)
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            onMessage(id, data)
          } catch (err) {
            // If it's not JSON, still forward raw text
            onMessage(id, e.data)
          }
        }
        es.onerror = () => {
          // EventSource will auto-reconnect, but to make sure cleanup is deterministic
          // we can close and reopen after a backoff if needed
        }
        sourcesRef.current[id] = es
      } catch (err) {
        console.error('Failed to create EventSource for ', id, err)
        sourcesRef.current[id] = null
      }
    }

    // Create sources for each id that doesn't exist yet
    ubicacionIds.forEach((u) => {
      const key = String(u)
      if (!sourcesRef.current[key]) {
        createSource(key)
      }
    })

    // Remove sources for ids that no longer needed
    const currentKeys = new Set(ubicacionIds.map((u) => String(u)))
    Object.keys(sourcesRef.current).forEach((existingKey) => {
      if (!currentKeys.has(existingKey)) {
        const es = sourcesRef.current[existingKey]
        if (es) {
          es.close()
        }
        delete sourcesRef.current[existingKey]
      }
    })

    // cleanup on unmount
    return () => {
      Object.values(sourcesRef.current).forEach((es) => {
        if (es) es.close()
      })
      sourcesRef.current = {}
    }

  }, [ubicacionIds.map(String).join(','), baseUrl]) // eslint-disable-line react-hooks/exhaustive-deps
}
