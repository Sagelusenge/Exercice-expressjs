import { useCallback } from 'react'
import { useSelector } from 'react-redux'

export const useParcelles = () => {
  const { parcelles, loading } = useSelector((state) => state.parcelles)

  const fetchParcelles = useCallback(async (filters) => {
    // Fetch logic
  }, [])

  return { parcelles, loading, fetchParcelles }
}
