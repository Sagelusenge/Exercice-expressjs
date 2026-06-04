import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetChatClientsQuery,
  useGetMessagesQuery,
  useGetOrCreateDirectConversationMutation,
  useSendMessageMutation,
  useCloseConversationMutation,
} from '../../../store/api/chatApi';
import { CheckCircle, MessageSquare, Send, Smile, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PREDEFINED_MESSAGES = [
  "Bonjour, comment puis-je vous aider ?",
  "Merci pour votre message, nous allons traiter votre demande.",
  "Pouvez-vous preciser votre question ?",
  "Nous allons vous contacter dans les plus brefs delais.",
  "Votre demande a bien ete prise en compte.",
  "Merci de votre patience.",
];

const adminRoles = ['SUPER_ADMIN', 'BOSS', 'GERANT'];

const ChatAdminPage = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showPredefined, setShowPredefined] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: clients = [], isLoading, error } = useGetChatClientsQuery(undefined, {
    pollingInterval: 5000,
  });
  const { data: messages = [], isLoading: loadingMessages } = useGetMessagesQuery(selectedConv?.id, {
    skip: !selectedConv?.id,
    pollingInterval: 3000,
  });

  const [getOrCreateDirectConversation, { isLoading: openingConversation }] = useGetOrCreateDirectConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const [closeConversation] = useCloseConversationMutation();

  const visibleClients = useMemo(() => clients.filter(Boolean), [clients]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    try {
      const conversation = await getOrCreateDirectConversation({ user_id: client.id }).unwrap();
      setSelectedConv(conversation);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ouvrir la conversation");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv) return;

    try {
      await sendMessage({ conversationId: selectedConv.id, contenu: messageText }).unwrap();
      setMessageText('');
      setShowPredefined(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  const handleClose = async () => {
    if (!selectedConv) return;
    try {
      await closeConversation(selectedConv.id).unwrap();
      toast.success('Conversation fermee');
      setSelectedConv({ ...selectedConv, statut: 'FERMEE' });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la fermeture');
    }
  };

  const clientName = selectedClient ? `${selectedClient.prenom} ${selectedClient.nom}` : '';

  if (error) {
    return <div className="p-6 text-error">Erreur de chargement du chat</div>;
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-96px)] flex-col overflow-hidden bg-surface-lowest md:flex-row">
      <div className="h-64 w-full border-b border-outline-variant flex flex-col bg-surface md:h-auto md:w-80 md:border-b-0 md:border-r">
        <div className="p-4 border-b border-outline-variant bg-surface-low">
          <h2 className="font-bold text-on-surface">Clients</h2>
          <p className="text-xs text-on-surface-variant">Choisissez un client pour discuter</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-on-surface-variant">Chargement...</div>
          ) : visibleClients.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              Aucun client actif pour le moment.
            </div>
          ) : (
            visibleClients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full p-4 text-left border-b border-outline-variant transition-colors hover:bg-surface-low ${
                  selectedClient?.id === client.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                }`}
                disabled={openingConversation}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-on-surface truncate">
                        {client.prenom} {client.nom}
                      </span>
                      {Number(client.unread_count || 0) > 0 ? (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-error text-on-error text-[11px] font-bold flex items-center justify-center">
                          {Number(client.unread_count) > 9 ? '9+' : client.unread_count}
                        </span>
                      ) : client.updated_at && (
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                          {format(new Date(client.updated_at), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {client.code_user || client.code_locataire || 'Compte client'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface-lowest">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-outline-variant bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{clientName}</h3>
                  <span className="text-xs text-on-surface-variant">
                    {selectedClient?.code_user || selectedClient?.code_locataire || 'Compte client'}
                  </span>
                </div>
              </div>
              {selectedConv.statut !== 'FERMEE' && (
                <button
                  onClick={handleClose}
                  className="flex items-center gap-2 px-3 py-2 text-error hover:bg-error/10 rounded-lg transition"
                >
                  <CheckCircle size={16} />
                  Fermer
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-lowest">
              {loadingMessages ? (
                <div className="text-center text-on-surface-variant">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-on-surface-variant italic">Aucun message</div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = adminRoles.includes(msg.sender_role);
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[86%] sm:max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                          isAdmin
                            ? 'bg-primary text-on-primary rounded-br-none'
                            : 'bg-surface border border-outline-variant text-on-surface rounded-bl-none'
                        }`}
                      >
                        <p>{msg.contenu}</p>
                        <span className="block mt-1 text-[10px] opacity-70 text-right">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedConv.statut !== 'FERMEE' && (
              <div className="bg-surface border-t border-outline-variant">
                {showPredefined && (
                  <div className="p-3 border-b border-outline-variant bg-surface-low">
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_MESSAGES.map((text) => (
                        <button
                          key={text}
                          onClick={() => {
                            setMessageText(text);
                            setShowPredefined(false);
                          }}
                          className="px-3 py-1 text-sm bg-surface border border-outline-variant rounded-full hover:bg-surface-low transition"
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <form onSubmit={handleSend} className="p-3 sm:p-4 flex gap-2 sm:gap-3 items-end">
                  <button
                    type="button"
                    onClick={() => setShowPredefined((value) => !value)}
                    className="shrink-0 p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition"
                  >
                    <Smile size={24} />
                  </button>
                  <input
                    type="text"
                    placeholder="Tapez un message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="min-w-0 flex-1 px-4 py-3 border border-outline-variant rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-on-surface"
                  />
                  <button
                    type="submit"
                    className="shrink-0 p-3 bg-primary text-on-primary rounded-full hover:opacity-90 transition disabled:opacity-50"
                    disabled={!messageText.trim()}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8">
            <MessageSquare size={72} className="opacity-20 mb-4" />
            <h3 className="text-xl font-semibold text-on-surface mb-2">Selectionnez un client</h3>
            <p className="text-center max-w-md">
              La discussion directe avec ce client s'ouvrira automatiquement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAdminPage;
