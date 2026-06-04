// Utility functions for formatting
export const currencySymbol = (devise = 'USD') => {
  if (devise === 'CDF') return 'Fc'
  return '$'
}

export const formatCurrency = (amount, devise = 'USD') => {
  const value = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))

  return devise === 'CDF' ? `${value} Fc` : `$ ${value}`
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
