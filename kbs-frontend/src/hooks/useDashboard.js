import { useCallback } from 'react'

export const useDashboard = () => {
  const fetchDashboardData = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchDashboardData }
}
