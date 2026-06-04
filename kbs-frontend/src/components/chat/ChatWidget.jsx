import React from 'react'
import { MessageCircle } from 'lucide-react'

const ChatWidget = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 right-6 sm:bottom-6 sm:right-6 bg-[#25D366] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#128C7E] z-40 transition-all"
    >
      <MessageCircle size={28} />
    </button>
  )
}

export default ChatWidget
