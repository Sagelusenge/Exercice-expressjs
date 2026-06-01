// Helper utilities
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']
  return colors[Math.floor(Math.random() * colors.length)]
}
