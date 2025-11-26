export interface ApiOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiFetch(input: string, options: ApiOptions = {}) {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  // Build url
  let url = input
  if (!/^https?:\/\//i.test(input)) {
    url = `${base}${input.startsWith('/') ? '' : '/'}${input}`
  }

  const headers = new Headers(options.headers || {})
  if (!options.skipAuth) {
    const token = localStorage.getItem('google_credential')
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const r = await fetch(url, { ...options, headers })
    if (!r.ok) {
      // Record the error for UI debug overlay
      const errText = await r.text().catch(() => '')
      addApiError({ url, status: r.status, statusText: r.statusText, text: errText })
      return r
    }
    return r
  } catch (err: any) {
    addApiError({ url, status: 0, statusText: err.message, text: '' })
    throw err
  }
}

export function addApiError(item: { url: string; status: number; statusText: string; text?: string }) {
  // push into a global array for debug overlay
  try {
    const g = (window as any).__API_ERRORS__ ||= []
    g.push({ ...item, timestamp: Date.now() })
    // keep only last 20
    if (g.length > 20) g.splice(0, g.length - 20)
  } catch (e) {
    // ignore
  }
}

export function getApiErrors() {
  return ((window as any).__API_ERRORS__) || []
}
