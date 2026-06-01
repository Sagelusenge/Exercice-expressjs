import { useCallback } from 'react'

export const usePaiements = () => {
  const fetchPaiements = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchPaiements }
}
