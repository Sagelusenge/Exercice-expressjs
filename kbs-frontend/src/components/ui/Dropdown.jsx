import React, { useState } from 'react'

const Dropdown = ({ trigger, items = [], className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative inline-block ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)}>{trigger}</button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick?.()
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown
