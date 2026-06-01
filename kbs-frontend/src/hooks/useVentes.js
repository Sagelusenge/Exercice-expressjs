import { useCallback } from 'react'

export const useVentes = () => {
  const fetchVentes = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchVentes }
}
