const jwt = require("jsonwebtoken");
const { query } = require("../../config/database");
const { logger } = require("../../utils/logger.util");

const initChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Token requis"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query(
        "SELECT id, nom, prenom, role, tenant_id FROM users WHERE id = ? AND statut = 'ACTIF'",
        [decoded.userId]
      );

      if (!users.length) return next(new Error("Utilisateur introuvable"));
      socket.user = users[0];
      next();
    } catch (err) {
      next(new Error("Token invalide"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    socket.join(`tenant:${user.tenant_id}`);

    socket.on("join:conversation", async (conversationId) => {
      socket.join(`conv:${conversationId}`);
      await query(
        `UPDATE chat_messages SET est_lu = 1, lu_at = NOW()
         WHERE conversation_id = ? AND sender_id != ? AND est_lu = 0`,
        [conversationId, user.id]
      );
      socket.emit("joined", { conversationId });
    });

    socket.on("send:message", async (data) => {
      try {
        const { conversation_id, contenu, type_message, fichier_url } = data;
        const result = await query(
          `INSERT INTO chat_messages
           (conversation_id, sender_id, contenu, type_message, fichier_url)
           VALUES (?, ?, ?, ?, ?)`,
          [conversation_id, user.id, contenu, type_message || "TEXTE", fichier_url]
        );

        await query(
          "UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?",
          [conversation_id]
        );

        const [message] = await query(
          `SELECT cm.*, CONCAT(u.nom,' ',u.prenom) AS sender_nom, u.role AS sender_role
           FROM chat_messages cm
           JOIN users u ON u.id = cm.sender_id
           WHERE cm.id = ?`,
          [result.insertId]
        );

        io.to(`conv:${conversation_id}`).emit("new:message", message);
        socket.to(`tenant:${user.tenant_id}`).emit("conversation:updated", {
          conversation_id,
          last_message: message,
        });
      } catch (err) {
        logger.error("Socket send:message error:", err.message);
        socket.emit("error:message", { message: err.message });
      }
    });

    socket.on("typing:start", ({ conversation_id }) => {
      socket.to(`conv:${conversation_id}`).emit("user:typing", {
        user_id: user.id,
        nom: `${user.nom} ${user.prenom}`,
      });
    });

    socket.on("typing:stop", ({ conversation_id }) => {
      socket.to(`conv:${conversation_id}`).emit("user:stop_typing", {
        user_id: user.id,
      });
    });

    socket.on("disconnect", () => {
      socket.leave(`tenant:${user.tenant_id}`);
    });
  });
};

module.exports = { initChatSocket };