import React from 'react'

const Input = ({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  error = false,
  className = '',
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        w-full px-4 py-2 border rounded-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    />
  )
}

export default Input
