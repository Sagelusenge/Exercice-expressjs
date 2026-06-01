import React, { useState } from 'react'

const ParcelleFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    priceMin: '',
    priceMax: '',
    status: '',
  })

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filtres</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          placeholder="Prix min"
          value={filters.priceMin}
          onChange={(e) => handleChange('priceMin', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          placeholder="Prix max"
          value={filters.priceMax}
          onChange={(e) => handleChange('priceMax', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="sold">Vendu</option>
          <option value="reserved">Réservé</option>
        </select>
      </div>
    </div>
  )
}

export default ParcelleFilters
