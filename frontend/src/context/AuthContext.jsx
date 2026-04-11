import PropTypes from 'prop-types'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('truecert_token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const persistSession = (newToken, newUser) => {
    localStorage.setItem('truecert_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const clearSession = () => {
    localStorage.removeItem('truecert_token')
    setToken('')
    setUser(null)
  }

  const bootstrapAuth = async () => {
    const storedToken = localStorage.getItem('truecert_token')

    if (!storedToken) {
      setLoading(false)
      return
    }

    try {
      const { data } = await api.get('/auth/me')
      setToken(storedToken)
      setUser(data.user)
    } catch {
      clearSession()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bootstrapAuth()
  }, [])

  const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })
    persistSession(data.token, data.user)
    return data.user
  }

  const register = async ({ name, email, password, organization }) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      organization,
    })

    persistSession(data.token, data.user)
    return data.user
  }

  const logout = () => {
    clearSession()
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
