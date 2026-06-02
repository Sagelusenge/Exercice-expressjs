const { query } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");

/**
 * Créer une conversation
 * Le trigger trg_conversation_before_insert génère la référence KBS-CONV-XXX
 */
const createConversation = async (tenantId, userId, data) => {
  const { sujet, module, type_conversation, reference_id } = data;

  const result = await query(
    `INSERT INTO chat_conversations
     (tenant_id, sujet, module, type_conversation, reference_id, cree_par)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tenantId, sujet, module || "GENERAL", type_conversation || "GENERAL",
     reference_id || null, userId]
  );

  const convId = result.insertId;

  // Ajouter le créateur comme participant
  await query(
    `INSERT INTO chat_participants (conversation_id, user_id, role_dans_conversation)
     VALUES (?, ?, ?)`,
    [convId, userId, "CLIENT"]
  );

  return getConversationById(convId);
};

const getConversationById = async (id) => {
  const rows = await query(
    `SELECT cc.*, 
            CONCAT(u.nom,' ',u.prenom) AS initiateur,
            u.role AS role_initiateur
     FROM chat_conversations cc
     JOIN users u ON u.id = cc.cree_par
     WHERE cc.id = ?`,
    [id]
  );
  return rows[0];
};

/**
 * Envoyer un message
 * Le trigger trg_message_before_insert génère la référence KBS-MSG-XXX
 */
const sendMessage = async (conversationId, senderId, data) => {
  const { contenu, type_message, fichier_url, fichier_nom } = data;

  const result = await query(
    `INSERT INTO chat_messages
     (conversation_id, sender_id, contenu, type_message, fichier_url, fichier_nom)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conversationId, senderId, contenu, type_message || "TEXTE", fichier_url, fichier_nom]
  );

  // Mettre à jour updated_at de la conversation
  await query(
    "UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?",
    [conversationId]
  );

  const [message] = await query(
    `SELECT cm.*, CONCAT(u.nom,' ',u.prenom) AS sender_nom, u.role AS sender_role
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.id = ?`,
    [result.insertId]
  );

  return message;
};

/**
 * Messages d'une conversation
 */
const getMessages = async (conversationId, page = 1, limit = 50) => {
  const { offset, limit: l } = paginate(page, limit);

  const messages = await query(
    `SELECT cm.*, CONCAT(u.nom,' ',u.prenom) AS sender_nom,
            u.role AS sender_role, u.photo_url AS sender_photo
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.conversation_id = ? AND cm.est_supprime = 0
     ORDER BY cm.created_at DESC
     LIMIT ? OFFSET ?`,
    [conversationId, l, offset]
  );

  return messages.reverse(); // Ordre chronologique
};

/**
 * Conversations actives — vue v_chat_actif
 */
const getConversationsActives = async (tenantId, userId, role) => {
  const ADMIN_ROLES = ["SUPER_ADMIN", "BOSS", "GERANT"];

  if (ADMIN_ROLES.includes(role)) {
    // Admin voit toutes les conversations actives
    return query(
      "SELECT * FROM v_chat_actif WHERE tenant_id = ?",
      [tenantId]
    );
  }

  // Client/Locataire voit ses propres conversations
  return query(
    `SELECT cc.* FROM chat_conversations cc
     JOIN chat_participants cp ON cp.conversation_id = cc.id
     WHERE cc.tenant_id = ? AND cp.user_id = ? AND cc.statut != 'ARCHIVEE'
     ORDER BY cc.updated_at DESC`,
    [tenantId, userId]
  );
};

/**
 * Marquer messages comme lus
 */
const markAsRead = async (conversationId, userId) => {
  await query(
    `UPDATE chat_messages SET est_lu = 1, lu_at = NOW()
     WHERE conversation_id = ? AND sender_id != ? AND est_lu = 0`,
    [conversationId, userId]
  );

  await query(
    "UPDATE chat_participants SET date_derniere_lecture = NOW() WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
};

/**
 * Fermer une conversation
 */
const fermerConversation = async (conversationId, adminId) => {
  await query(
    "UPDATE chat_conversations SET statut = 'FERMEE', closed_at = NOW(), assigne_a = ? WHERE id = ?",
    [adminId, conversationId]
  );
};

module.exports = {
  createConversation,
  sendMessage,
  getMessages,
  getConversationsActives,
  markAsRead,
  fermerConversation,
};