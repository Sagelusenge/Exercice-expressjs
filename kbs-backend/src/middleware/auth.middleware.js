const jwt = require("jsonwebtoken");
const { query } = require("../config/database");
const { unauthorized, forbidden } = require("../utils/response.util");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorized(res, "Token d'authentification manquant");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await query(
      `SELECT u.*, t.statut AS tenant_statut,
              t.module_parcelles_actif, t.module_kbs_actif,
              t.module_chat_actif, t.module_reservation_actif
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [decoded.userId]
    );

    if (!users.length) {
      return unauthorized(res, "Utilisateur introuvable");
    }

    const user = users[0];

    if (user.statut === "SUPPRIME") {
      return unauthorized(res, "Compte supprimé");
    }

    if (user.statut === "BLOQUE") {
      if (user.bloque_jusqu_a && new Date() < new Date(user.bloque_jusqu_a)) {
        return forbidden(
          res,
          `Compte bloqué jusqu'au ${new Date(user.bloque_jusqu_a).toLocaleString()}`
        );
      }
      await query(
        `UPDATE users SET statut = 'ACTIF', tentatives_connexion_echouees = 0,
         bloque_jusqu_a = NULL WHERE id = ?`,
        [user.id]
      );
      user.statut = "ACTIF";
    }

    if (user.statut === "EN_ATTENTE_VERIFICATION") {
      return forbidden(res, "Veuillez vérifier votre adresse email");
    }

    if (user.statut !== "ACTIF") {
      return forbidden(res, "Compte inactif");
    }

    if (user.tenant_statut !== "ACTIF") {
      return forbidden(res, "Organisation suspendue");
    }

    req.user = user;
    req.tenantId = parseInt(user.tenant_id, 10);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return unauthorized(res, "Session expirée, veuillez vous reconnecter");
    }
    if (err.name === "JsonWebTokenError") {
      return unauthorized(res, "Token invalide");
    }
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuth };