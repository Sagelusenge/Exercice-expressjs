const { forbidden } = require("../utils/response.util");
const { MODULE } = require("../config/constants");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, "Authentification requise");
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Accès réservé aux rôles : ${roles.join(", ")}`);
    }
    next();
  };
};

const requireModule = (module) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, "Authentification requise");

    const acc = req.user.module_accessible;
    const tenantModule =
      module === MODULE.PARCELLES
        ? req.user.module_parcelles_actif
        : req.user.module_kbs_actif;

    if (!tenantModule) {
      return forbidden(res, `Module ${module} désactivé pour cette organisation`);
    }

    if (acc === "LES_DEUX") return next();
    if (acc === module) return next();

    return forbidden(res, `Accès au module ${module} non autorisé`);
  };
};

const requireOwnerOrAdmin = (userIdField = "user_id") => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, "Authentification requise");

    const ADMIN_ROLES = ["SUPER_ADMIN", "BOSS", "GERANT"];
    if (ADMIN_ROLES.includes(req.user.role)) return next();

    if (req.resource && req.resource[userIdField] === req.user.id) {
      return next();
    }

    return forbidden(res, "Vous ne pouvez accéder qu'à vos propres ressources");
  };
};

module.exports = { requireRole, requireModule, requireOwnerOrAdmin };