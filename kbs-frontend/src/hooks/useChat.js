import { useCallback } from 'react'

export const useChat = () => {
  const fetchChats = useCallback(async () => {
    // Fetch logic
  }, [])

  return { fetchChats }
}
