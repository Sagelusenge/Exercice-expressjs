const { query } = require("../config/database");
const { logger } = require("../utils/logger.util");
const sequenceService = require("../services/sequence.service");

const logActivity = (module, action, description = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          await query(
            `INSERT INTO activity_logs
             (reference, tenant_id, user_id, role_utilisateur, module, action,
              description, adresse_ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              await sequenceService.referenceActivity(req.tenantId || req.user?.tenant_id),
              req.tenantId || req.user?.tenant_id,
              req.user?.id,
              req.user?.role,
              module,
              action,
              description ||
                `${req.method} ${req.originalUrl} - User ${req.user?.code_user}`,
              req.ip || req.socket?.remoteAddress,
              req.headers["user-agent"]?.substring(0, 500),
            ]
          );
        } catch (err) {
          logger.warn("Erreur log activité:", err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { logActivity };
