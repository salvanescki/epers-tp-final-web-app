const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- NightBringer ---
export function crearNightBringer(dto: { nombre: string }) {
  return api<any>("/nightBringer", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function recuperarNightBringer(id: number) {
  return api<any>(`/nightBringer/${id}`);
}

export function spawnearEspiritu(
  nightBringerId: number,
  ubicacionId: number,
  nombreEspiritu: string
) {
  return api<any>(
    `/nightBringer/${nightBringerId}/spawnearEspirituEnUbicacion/${encodeURIComponent(
      nombreEspiritu
    )}/${ubicacionId}`,
    { method: "PATCH" }
  );
}

// --- Ubicaciones ---
export function getUbicaciones() {
  return api<any[]>("/ubicacion");
}

export function getEspiritusEnUbicacion(ubicacionId: number) {
  return api<any[]>(`/ubicacion/${ubicacionId}/espiritus`);
}
