import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, isAuthenticated, token } = useSelector((state) => state.auth)

  const login = useCallback((credentials) => {
    // Login logic
  }, [dispatch])

  const logout = useCallback(() => {
    // Logout logic
  }, [dispatch])

  return { user, isAuthenticated, token, login, logout }
}
