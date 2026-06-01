const { query } = require("../config/database");
const { badRequest, forbidden } = require("../utils/response.util");

const enforceTenant = async (req, res, next) => {
  try {
    if (req.user) {
      req.tenantId = parseInt(req.user.tenant_id, 10);
      return next();
    }

    const tenantSlug = req.headers["x-tenant-slug"];
    if (!tenantSlug) {
      req.tenantId = 1;
      return next();
    }

    const tenants = await query(
      "SELECT id, statut FROM tenants WHERE slug = ?",
      [tenantSlug]
    );

    if (!tenants.length) {
      return badRequest(res, "Organisation introuvable");
    }

    if (tenants[0].statut !== "ACTIF") {
      return forbidden(res, "Organisation suspendue");
    }

    req.tenantId = parseInt(tenants[0].id, 10);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { enforceTenant };