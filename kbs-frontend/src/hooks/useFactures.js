import { useCallback } from 'react'

export const useFactures = () => {
  const fetchFactures = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchFactures }
}
