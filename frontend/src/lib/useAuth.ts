import { useCallback, useMemo, useState } from 'react'

const TOKEN_KEY = 'smartlib_token'

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(getStoredToken())

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  return useMemo(() => ({ token, login, logout }), [token, login, logout])
}
