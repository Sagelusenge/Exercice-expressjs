import React from 'react'

const ParcelleMap = ({ latitude, longitude }) => {
  return (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-2">Carte intégrée</p>
        <p className="text-sm text-gray-500">
          Lat: {latitude?.toFixed(4)}, Lon: {longitude?.toFixed(4)}
        </p>
      </div>
    </div>
  )
}

export default ParcelleMap
