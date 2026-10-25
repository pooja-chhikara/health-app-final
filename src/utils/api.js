// Talks to the Pip API server (server/ folder, hosted on Render).
// Set VITE_API_URL in .env to your Render URL; defaults to the local server.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim().replace(/\/$/, '')
export const API_URL_SET = Boolean(import.meta.env.VITE_API_URL)

// Ping the server: { reachable, gemini }
export async function checkServer() {
  try {
    const res = await fetch(`${API_URL}/health`)
    const d = await res.json()
    return { reachable: res.ok, gemini: Boolean(d.gemini) }
  } catch {
    return { reachable: false, gemini: false }
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(
      API_URL_SET
        ? `Can't reach the Pip server at ${API_URL}. It may be waking up — wait 50 seconds and try again.`
        : 'The Pip server address is not set. Add VITE_API_URL (your Render server link) to .env / Render Environment.'
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
  return data
}

// Shrink a photo before sending/saving (keeps Firebase small and uploads fast)
export function fileToSmallDataUrl(file, maxSide = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a picture.'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
