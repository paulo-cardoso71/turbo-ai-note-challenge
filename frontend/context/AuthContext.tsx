'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  userEmail: string | null
  login: (email: string, access: string, refresh: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // On app load, check if token exists in cookies
    const token = Cookies.get('access_token')
    const email = Cookies.get('user_email')
    if (token) {
      setIsAuthenticated(true)
      setUserEmail(email || null)
    }
  }, [])

  const login = (email: string, access: string, refresh: string) => {
    Cookies.set('access_token', access, { expires: 1 })
    Cookies.set('refresh_token', refresh, { expires: 7 })
    Cookies.set('user_email', email, { expires: 1 })
    setIsAuthenticated(true)
    setUserEmail(email)
    router.push('/')
  }

  const logout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('user_email')
    setIsAuthenticated(false)
    setUserEmail(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}