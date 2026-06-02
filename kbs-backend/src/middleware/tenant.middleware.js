const { query } = require("../config/database");
const { badRequest, forbidden } = require("../utils/response.util");

const tenantCache = new Map();
const TENANT_CACHE_TTL_MS = Number(process.env.TENANT_CACHE_TTL_MS || 5 * 60 * 1000);

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

    const cachedTenant = tenantCache.get(tenantSlug);
    let tenant = cachedTenant && cachedTenant.expiresAt > Date.now()
      ? cachedTenant.value
      : null;

    if (!tenant) {
      const tenants = await query(
        "SELECT id, statut FROM tenants WHERE slug = ?",
        [tenantSlug]
      );

      tenant = tenants[0] || null;
      if (tenant) {
        tenantCache.set(tenantSlug, {
          value: tenant,
          expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
        });
      }
    }

    if (!tenant) {
      return badRequest(res, "Organisation introuvable");
    }

    if (tenant.statut !== "ACTIF") {
      return forbidden(res, "Organisation suspendue");
    }

    req.tenantId = parseInt(tenant.id, 10);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { enforceTenant };
