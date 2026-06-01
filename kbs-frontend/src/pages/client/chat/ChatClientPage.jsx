import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetMessagesQuery,
  useGetOrCreateDirectConversationMutation,
  useSendMessageMutation,
} from '../../../store/api/chatApi';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const QUICK_REPLIES = [
  "Bonjour admin",
  "Je veux encore beaucoup de renseignements.",
  "Bonjour, j'ai besoin d'aide.",
  "Je veux des informations sur une parcelle.",
  "Je veux verifier mon paiement.",
  "Merci, j'attends votre retour.",
];

const ChatClientPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const [openDirectConversation, { isLoading: opening }] = useGetOrCreateDirectConversationMutation();
  const { data: messages = [], isLoading: loadingMessages } = useGetMessagesQuery(selectedConv?.id, {
    skip: !selectedConv?.id,
    pollingInterval: 3000,
  });
  const [sendMessage] = useSendMessageMutation();

  useEffect(() => {
    const open = async () => {
      try {
        const conversation = await openDirectConversation().unwrap();
        setSelectedConv(conversation);
      } catch (err) {
        console.error(err);
        toast.error("Impossible d'ouvrir le chat");
      }
    };
    open();
  }, [openDirectConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedConv) return;

    try {
      await sendMessage({ conversationId: selectedConv.id, contenu: messageText }).unwrap();
      setMessageText('');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  const handleQuickReply = (text) => setMessageText(text);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-surface-lowest rounded-lg border border-outline-variant overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-outline-variant bg-surface flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-on-surface">Support KBS</h3>
            <span className="text-xs text-on-surface-variant">
              {opening ? 'Ouverture...' : 'Discussion directe avec ladmin'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-lowest">
          {loadingMessages || opening ? (
            <div className="text-center text-on-surface-variant">Chargement...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-on-surface-variant italic">Envoyez votre premier message.</div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                      isMine
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface text-on-surface rounded-tl-none border border-outline-variant'
                    }`}
                  >
                    <p>{msg.contenu}</p>
                    <span className="text-[10px] block mt-1 opacity-70 text-right">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-surface border-t border-outline-variant">
          <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleQuickReply(reply)}
                className="shrink-0 px-3 py-1.5 text-sm rounded-full border border-outline-variant text-on-surface hover:bg-surface-low"
              >
                {reply}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-4 flex gap-2">
            <input
              type="text"
              placeholder="Votre message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-on-surface"
              disabled={!selectedConv}
            />
            <button
              type="submit"
              className="p-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition disabled:opacity-50"
              disabled={!messageText.trim() || !selectedConv}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatClientPage;
