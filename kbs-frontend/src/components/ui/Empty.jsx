import React from 'react'

const Empty = ({ icon = '📭', title = 'Aucune donnée', description = '', action = null }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

export default Empty
