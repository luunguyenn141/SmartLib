const API_BASE = import.meta.env.VITE_API_BASE || ''
const AUTH_FAIL_EVENT = 'smartlib:auth-failed'

function isAuthFailure(status: number, path: string, hasToken: boolean): boolean {
  if (!hasToken) return false
  if (status === 401) return true
  if (status !== 403) return false
  return (
    path.startsWith('/api/users/me') ||
    path.startsWith('/api/my')
  )
}

function emitAuthFailure() {
  window.dispatchEvent(new CustomEvent(AUTH_FAIL_EVENT))
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text()
  if (!text) return res.statusText
  try {
    const json = JSON.parse(text) as { message?: string; error?: string; fields?: Record<string, string> }
    if (json.message) return json.message
    if (json.fields && Object.keys(json.fields).length > 0) {
      const firstField = Object.keys(json.fields)[0]
      return `${firstField}: ${json.fields[firstField]}`
    }
    if (json.error) return json.error
  } catch {
    // ignore
  }
  return text
}

export type AuthResponse = { token: string }

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })
  if (!res.ok) {
    if (isAuthFailure(res.status, path, Boolean(token))) {
      emitAuthFailure()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error(await parseError(res))
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if (isAuthFailure(res.status, path, Boolean(token))) {
      emitAuthFailure()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error(await parseError(res))
  }
  return res.json() as Promise<T>
}

export async function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if (isAuthFailure(res.status, path, Boolean(token))) {
      emitAuthFailure()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error(await parseError(res))
  }
  return res.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if (isAuthFailure(res.status, path, Boolean(token))) {
      emitAuthFailure()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error(await parseError(res))
  }
  return res.json() as Promise<T>
}

export async function apiDelete<T>(path: string, token?: string): Promise<T | undefined> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })
  if (!res.ok) {
    if (isAuthFailure(res.status, path, Boolean(token))) {
      emitAuthFailure()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error(await parseError(res))
  }
  const text = await res.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export { AUTH_FAIL_EVENT }
