// Application constants
export const APP_NAME = 'KBS'
export const APP_VERSION = '1.0.0'

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  LOCATAIRE: 'locataire',
  USER: 'user',
}

export const PARCELLE_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
}

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const VENTE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const PAIEMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000'

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}
