import React from 'react'

const ChatBubble = ({ message, sender = 'user', timestamp }) => {
  const isUser = sender === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-xs px-4 py-2 rounded-lg
          ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}
        `}
      >
        <p>{message}</p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-600'}`}>
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default ChatBubble
