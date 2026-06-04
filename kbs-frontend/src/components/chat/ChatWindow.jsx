import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Smile, User } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Messages prédéfinis pour le client
const CLIENT_PREDEFINED = [
  "Bonjour, j'ai une question sur les parcelles.",
  "Je voudrais des informations sur les prix.",
  "Comment puis-je visiter un bien ?",
  "Quels sont les documents nécessaires ?",
  "Je voudrais réserver une parcelle.",
]

const ChatWindow = ({ isOpen, onClose, initialMessages = [] }) => {
  const [messageText, setMessageText] = useState('');
  const [showPredefined, setShowPredefined] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    // Ajouter le message localement pour l'instant
    const newMsg = {
      id: Date.now(),
      contenu: messageText,
      sender_role: 'CLIENT',
      created_at: new Date().toISOString(),
    };
    setMessages([...messages, newMsg]);
    setMessageText('');
    setShowPredefined(false);
  };

  const handleSelectPredefined = (text) => {
    setMessageText(text);
    setShowPredefined(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-3 sm:right-6 w-[320px] sm:w-96 h-[550px] bg-white rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-[#008069] text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Support KBS</h3>
            <span className="text-xs text-green-100">En ligne</span>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 italic mt-8">
            Commencez la conversation !
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_role === 'CLIENT' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                  msg.sender_role === 'CLIENT'
                    ? 'bg-[#dcf8c6] rounded-br-none'
                    : 'bg-white rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-gray-800">{msg.contenu}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  msg.sender_role === 'CLIENT' ? 'justify-end' : 'justify-start'
                }`}>
                  <span className="text-[10px] text-gray-500">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100">
        {/* Predefined messages */}
        {showPredefined && (
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Messages rapides :</p>
            <div className="flex flex-wrap gap-2">
              {CLIENT_PREDEFINED.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPredefined(text)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSend} className="p-3 flex gap-2 items-end">
          <button
            type="button"
            onClick={() => setShowPredefined(!showPredefined)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
          >
            <Smile size={24} />
          </button>
          <input
            type="text"
            placeholder="Tapez un message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-white"
          />
          <button 
            type="submit" 
            className="p-2 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!messageText.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow
