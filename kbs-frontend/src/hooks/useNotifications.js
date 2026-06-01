import { useCallback } from 'react'

export const useNotifications = () => {
  const fetchNotifications = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchNotifications }
}
