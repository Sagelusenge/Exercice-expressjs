const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const emailService = require("../../services/email.service");
const { logger } = require("../../utils/logger.util");

const ADMIN_ROLES = ["SUPER_ADMIN", "BOSS", "GERANT"];

const participantRole = (role) => (ADMIN_ROLES.includes(role) ? "ADMIN" : role);

const getAutoReply = (role, contenu, sender) => {
  if (ADMIN_ROLES.includes(role)) return false;
  const text = (contenu || "").trim().toLowerCase();
  const name = sender.prenom || sender.nom || "cher utilisateur";
  if (text.includes("bonjour admin")) return `Bonjour ${name}`;
  if (text.includes("beaucoup de renseignement") || text.includes("renseignement")) {
    return `${name}, dites-nous ce que vous voulez savoir: parcelle, paiement, reservation, visite ou facture. Un administrateur va aussi vous repondre.`;
  }
  if (text.includes("paiement")) return `${name}, votre demande sur le paiement est recue. Precisez la reference ou le montant.`;
  if (text.includes("reservation")) return `${name}, votre demande sur la reservation est recue. Precisez la parcelle concernee.`;
  return null;
};

const sendAutoReply = async ({ conversationId, sender, contenu }) => {
  const reply = getAutoReply(sender.role, contenu, sender);
  if (!reply) return;

  const [admin] = await query(
    `SELECT u.id
     FROM chat_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = ?
       AND u.role IN ('SUPER_ADMIN','BOSS','GERANT')
       AND u.deleted_at IS NULL
     ORDER BY FIELD(u.role, 'SUPER_ADMIN', 'BOSS', 'GERANT'), u.id
     LIMIT 1`,
    [conversationId]
  );
  if (!admin) return;

  await query(
    `INSERT INTO chat_messages
     (conversation_id, sender_id, contenu, type_message)
     VALUES (?, ?, ?, 'SYSTEME')`,
    [conversationId, admin.id, reply]
  );
};

const findSupportAdmin = async (tenantId) => {
  const admins = await query(
    `SELECT id, nom, prenom, email, role
     FROM users
     WHERE tenant_id = ?
       AND role IN ('SUPER_ADMIN','BOSS','GERANT')
       AND statut = 'ACTIF'
       AND deleted_at IS NULL
     ORDER BY FIELD(role, 'SUPER_ADMIN', 'BOSS', 'GERANT'), id
     LIMIT 1`,
    [tenantId]
  );
  return admins[0];
};

const findDirectConversation = async (tenantId, userA, userB) => {
  const conversations = await query(
    `SELECT cc.*
     FROM chat_conversations cc
     JOIN chat_participants p1 ON p1.conversation_id = cc.id AND p1.user_id = ?
     JOIN chat_participants p2 ON p2.conversation_id = cc.id AND p2.user_id = ?
     WHERE cc.tenant_id = ?
       AND cc.type_conversation = 'SUPPORT'
       AND cc.statut != 'ARCHIVEE'
     ORDER BY cc.updated_at DESC
     LIMIT 1`,
    [userA, userB, tenantId]
  );
  return conversations[0];
};

const getConversation = async (id, tenantId) => {
  const rows = await query(
    `SELECT cc.*, u.nom AS sender_nom, u.prenom AS sender_prenom, u.email AS sender_email
     FROM chat_conversations cc
     JOIN users u ON u.id = cc.cree_par
     WHERE cc.id = ? AND cc.tenant_id = ?`,
    [id, tenantId]
  );
  return rows[0];
};

const createDirectConversation = async ({ tenantId, creatorId, clientUser, adminUser }) => {
  const sujet = `Discussion avec ${clientUser.prenom} ${clientUser.nom}`;
  const result = await query(
    `INSERT INTO chat_conversations
     (tenant_id, sujet, module, type_conversation, cree_par, assigne_a)
     VALUES (?, ?, 'GENERAL', 'SUPPORT', ?, ?)`,
    [tenantId, sujet, creatorId, adminUser.id]
  );

  await query(
    `INSERT INTO chat_participants (conversation_id, user_id, role_dans_conversation)
     VALUES (?, ?, ?), (?, ?, 'ADMIN')`,
    [result.insertId, clientUser.id, participantRole(clientUser.role), result.insertId, adminUser.id]
  );

  return getConversation(result.insertId, tenantId);
};

const notifyMessageRecipients = async ({ tenantId, conversationId, sender, contenu }) => {
  const recipients = await query(
    `SELECT u.id, u.email, u.nom, u.prenom
     FROM chat_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = ?
       AND cp.user_id != ?
       AND u.deleted_at IS NULL`,
    [conversationId, sender.id]
  );

  await Promise.all(recipients.map(async (recipient) => {
    const titre = "Nouveau message";
    const message = `${sender.prenom} ${sender.nom}: ${(contenu || "").slice(0, 120)}`;

    await query(
      `INSERT INTO notifications
       (tenant_id, user_id, titre, message, module, type, canal, donnees_supplementaires)
       VALUES (?, ?, ?, ?, 'SYSTEME', 'ALERTE_SYSTEME', 'APP', ?)`,
      [tenantId, recipient.id, titre, message, JSON.stringify({ conversation_id: Number(conversationId) })]
    );

    await query(
      `INSERT INTO email_logs
       (tenant_id, user_id, destinataire_email, sujet, template_utilise, statut)
       VALUES (?, ?, ?, ?, 'CHAT_NOUVEAU_MESSAGE', 'EN_ATTENTE')`,
      [tenantId, recipient.id, recipient.email, titre]
    );

    try {
      const ok = await emailService.sendEmail(
        recipient.email,
        titre,
        `<p>Bonjour ${recipient.prenom},</p><p>Vous avez recu un nouveau message de ${sender.prenom} ${sender.nom}.</p><p>${contenu || ""}</p>`
      );

      await query(
        `UPDATE email_logs
         SET statut = ?
         WHERE tenant_id = ?
           AND user_id = ?
           AND destinataire_email = ?
           AND sujet = ?
           AND template_utilise = 'CHAT_NOUVEAU_MESSAGE'
         ORDER BY date_envoi DESC
         LIMIT 1`,
        [ok ? "ENVOYE" : "ECHOUE", tenantId, recipient.id, recipient.email, titre]
      );

      if (!ok) {
        logger.warn(`📧 Email CHAT non envoye a ${recipient.email}`);
      }
    } catch (err) {
      logger.error(`❌ Email CHAT erreur a ${recipient.email}:`, { message: err.message });
      await query(
        `UPDATE email_logs
         SET statut = 'ECHOUE'
         WHERE tenant_id = ?
           AND user_id = ?
           AND destinataire_email = ?
           AND sujet = ?
           AND template_utilise = 'CHAT_NOUVEAU_MESSAGE'
         ORDER BY date_envoi DESC
         LIMIT 1`,
        [tenantId, recipient.id, recipient.email, titre]
      );
    }
  }));
};

router.post("/conversations", authenticate, enforceTenant, logActivity("CHAT", "CONVERSATION_CREEE"), async (req, res) => {
  const { sujet, module, type_conversation, reference_id } = req.body;

  const result = await query(
    `INSERT INTO chat_conversations
     (tenant_id, sujet, module, type_conversation, reference_id, cree_par)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.tenantId, sujet || "Support KBS", module || "GENERAL", type_conversation || "GENERAL", reference_id || null, req.user.id]
  );

  await query(
    `INSERT INTO chat_participants (conversation_id, user_id, role_dans_conversation)
     VALUES (?, ?, ?)`,
    [result.insertId, req.user.id, participantRole(req.user.role)]
  );

  const conv = await getConversation(result.insertId, req.tenantId);
  return R.created(res, conv, "Conversation creee");
});

router.get(
  "/clients",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const clients = await query(
      `SELECT u.id, u.code_user, u.nom, u.prenom, u.email, u.role, u.photo_url,
              cc.id AS conversation_id, cc.sujet, cc.statut, cc.updated_at,
              (
                SELECT cm.contenu
                FROM chat_messages cm
                WHERE cm.conversation_id = cc.id AND cm.est_supprime = 0
                ORDER BY cm.created_at DESC
                LIMIT 1
              ) AS dernier_message,
              (
                SELECT COUNT(*)
                FROM chat_messages cm_unread
                LEFT JOIN chat_participants cp_admin
                       ON cp_admin.conversation_id = cc.id
                      AND cp_admin.user_id = ?
                WHERE cm_unread.conversation_id = cc.id
                  AND cm_unread.sender_id = u.id
                  AND cm_unread.est_supprime = 0
                  AND cm_unread.created_at > COALESCE(cp_admin.date_derniere_lecture, '1970-01-01')
              ) AS unread_count
       FROM users u
       LEFT JOIN chat_participants cpu ON cpu.user_id = u.id
       LEFT JOIN chat_conversations cc
              ON cc.id = cpu.conversation_id
             AND cc.tenant_id = u.tenant_id
             AND cc.type_conversation = 'SUPPORT'
             AND cc.statut != 'ARCHIVEE'
       WHERE u.tenant_id = ?
         AND u.role IN ('CLIENT','LOCATAIRE')
         AND u.deleted_at IS NULL
       GROUP BY u.id, u.code_user, u.nom, u.prenom, u.email, u.role, u.photo_url,
                cc.id, cc.sujet, cc.statut, cc.updated_at
       ORDER BY COALESCE(cc.updated_at, u.created_at) DESC`,
      [req.user.id, req.tenantId]
    );
    return R.success(res, clients);
  }
);

router.post("/conversations/direct", authenticate, enforceTenant, logActivity("CHAT", "CONVERSATION_DIRECTE"), async (req, res) => {
  let clientUser;
  let adminUser;

  if (ADMIN_ROLES.includes(req.user.role)) {
    if (!req.body.user_id) return R.badRequest(res, "Client requis");
    const users = await query(
      `SELECT id, nom, prenom, email, role
       FROM users
       WHERE id = ? AND tenant_id = ? AND role IN ('CLIENT','LOCATAIRE') AND deleted_at IS NULL`,
      [req.body.user_id, req.tenantId]
    );
    if (!users.length) return R.notFound(res, "Client introuvable");
    clientUser = users[0];
    adminUser = req.user;
  } else {
    clientUser = req.user;
    adminUser = await findSupportAdmin(req.tenantId);
    if (!adminUser) return R.badRequest(res, "Aucun administrateur disponible pour le chat");
  }

  const existing = await findDirectConversation(req.tenantId, clientUser.id, adminUser.id);
  if (existing) return R.success(res, existing);

  const conversation = await createDirectConversation({
    tenantId: req.tenantId,
    creatorId: req.user.id,
    clientUser,
    adminUser,
  });
  return R.created(res, conversation, "Conversation ouverte");
});

router.get("/conversations", authenticate, enforceTenant, async (req, res) => {
  let data;

  if (ADMIN_ROLES.includes(req.user.role)) {
    try {
      data = await query(
        "SELECT * FROM v_chat_actif WHERE tenant_id = ? ORDER BY updated_at DESC",
        [req.tenantId]
      );
    } catch (e) {
      data = await query(
        `SELECT cc.*, u.nom AS sender_nom, u.prenom AS sender_prenom
         FROM chat_conversations cc
         JOIN users u ON u.id = cc.cree_par
         WHERE cc.tenant_id = ? AND cc.statut != 'ARCHIVEE'
         ORDER BY cc.updated_at DESC`,
        [req.tenantId]
      );
    }
  } else {
    data = await query(
      `SELECT cc.*
       FROM chat_conversations cc
       JOIN chat_participants cp ON cp.conversation_id = cc.id
       WHERE cc.tenant_id = ? AND cp.user_id = ? AND cc.statut != 'ARCHIVEE'
       ORDER BY cc.updated_at DESC`,
      [req.tenantId, req.user.id]
    );
  }

  return R.success(res, data);
});

router.patch(
  "/conversations/:id/fermer",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("CHAT", "CONVERSATION_FERMEE"),
  async (req, res) => {
    await query(
      "UPDATE chat_conversations SET statut = 'FERMEE', closed_at = NOW(), assigne_a = ? WHERE id = ? AND tenant_id = ?",
      [req.user.id, req.params.id, req.tenantId]
    );
    return R.success(res, null, "Conversation fermee");
  }
);

router.get("/conversations/:id/messages", authenticate, enforceTenant, async (req, res) => {
  const [participant] = await query(
    "SELECT id FROM chat_participants WHERE conversation_id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  if (!participant && !ADMIN_ROLES.includes(req.user.role)) {
    return R.forbidden(res, "Acces interdit a cette conversation");
  }

  const messages = await query(
    `SELECT cm.*, CONCAT(u.nom,' ',u.prenom) AS sender_nom,
            u.role AS sender_role, u.photo_url AS sender_photo
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.conversation_id = ? AND cm.est_supprime = 0
     ORDER BY cm.created_at ASC`,
    [req.params.id]
  );
  return R.success(res, messages);
});

router.post("/conversations/:id/messages", authenticate, enforceTenant, logActivity("CHAT", "MESSAGE_ENVOYE"), async (req, res) => {
  const { contenu, type_message, fichier_url, fichier_nom } = req.body;
  if (!contenu && !fichier_url) return R.badRequest(res, "Message vide");

  const [conversation] = await query(
    "SELECT id FROM chat_conversations WHERE id = ? AND tenant_id = ? AND statut != 'ARCHIVEE'",
    [req.params.id, req.tenantId]
  );
  if (!conversation) return R.notFound(res, "Conversation introuvable");

  const [participant] = await query(
    "SELECT id FROM chat_participants WHERE conversation_id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  if (!participant && !ADMIN_ROLES.includes(req.user.role)) {
    return R.forbidden(res, "Acces interdit a cette conversation");
  }

  const result = await query(
    `INSERT INTO chat_messages
     (conversation_id, sender_id, contenu, type_message, fichier_url, fichier_nom)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.params.id, req.user.id, contenu, type_message || "TEXTE", fichier_url || null, fichier_nom || null]
  );

  await query(
    "UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?",
    [req.params.id]
  );

  await sendAutoReply({ conversationId: req.params.id, sender: req.user, contenu });
  await query(
    "UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?",
    [req.params.id]
  );

  const [message] = await query(
    `SELECT cm.*, CONCAT(u.nom,' ',u.prenom) AS sender_nom, u.role AS sender_role
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.id = ?`,
    [result.insertId]
  );

  await notifyMessageRecipients({
    tenantId: req.tenantId,
    conversationId: req.params.id,
    sender: req.user,
    contenu,
  });

  return R.created(res, message, "Message envoye");
});

router.patch("/conversations/:id/lire", authenticate, enforceTenant, async (req, res) => {
  await query(
    `UPDATE chat_messages SET est_lu = 1, lu_at = NOW()
     WHERE conversation_id = ? AND sender_id != ? AND est_lu = 0`,
    [req.params.id, req.user.id]
  );
  await query(
    "UPDATE chat_participants SET date_derniere_lecture = NOW() WHERE conversation_id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  return R.success(res, null, "Messages marques comme lus");
});

module.exports = router;
