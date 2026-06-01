import React from 'react'

const ChatList = ({ chats = [], onSelectChat }) => {
  return (
    <div className="border-r h-screen overflow-auto w-80">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className="w-full p-4 border-b hover:bg-gray-100 text-left"
        >
          <p className="font-semibold">{chat.name}</p>
          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
        </button>
      ))}
    </div>
  )
}

export default ChatList
