import React from 'react'

const DonutChart = ({ data = [], title = '' }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Graphique donut</p>
      </div>
    </div>
  )
}

export default DonutChart
