import React from 'react'

const ParcelleBadge = ({ status }) => {
  const statusMap = {
    available: { label: 'Disponible', color: 'green' },
    sold: { label: 'Vendu', color: 'red' },
    reserved: { label: 'Réservé', color: 'yellow' },
  }

  const { label, color } = statusMap[status] || { label: 'Inconnu', color: 'gray' }
  const colorClasses = {
    green: 'bg-green-100 text-green-900',
    red: 'bg-red-100 text-red-900',
    yellow: 'bg-yellow-100 text-yellow-900',
    gray: 'bg-gray-100 text-gray-900',
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colorClasses[color]}`}>
      {label}
    </span>
  )
}

export default ParcelleBadge
