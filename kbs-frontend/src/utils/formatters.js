// Utility functions for formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
  }).format(amount)
}

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
}

export const formatDatetime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const truncateText = (text, length = 50) => {
  return text.length > length ? `${text.slice(0, length)}...` : text
}
