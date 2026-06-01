import React from 'react'

const Select = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Sélectionner...',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        w-full px-4 py-2 border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default Select
