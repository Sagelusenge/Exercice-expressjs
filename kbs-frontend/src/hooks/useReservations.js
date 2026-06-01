import { useCallback } from 'react'

export const useReservations = () => {
  const fetchReservations = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchReservations }
}
