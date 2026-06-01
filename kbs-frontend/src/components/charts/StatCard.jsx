import React from 'react'

const StatCard = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      {icon && <div className="text-4xl">{icon}</div>}
    </div>
  )
}

export default StatCard
