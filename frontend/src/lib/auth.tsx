import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_FAIL_EVENT } from './api'

type AuthContextValue = {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const TOKEN_KEY = 'smartlib_token'
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken())

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  useEffect(() => {
    const onAuthFailed = () => logout()
    window.addEventListener(AUTH_FAIL_EVENT, onAuthFailed)
    return () => window.removeEventListener(AUTH_FAIL_EVENT, onAuthFailed)
  }, [logout])

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
