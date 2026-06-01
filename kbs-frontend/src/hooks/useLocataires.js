import { useCallback } from 'react'

export const useLocataires = () => {
  const fetchLocataires = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchLocataires }
}
