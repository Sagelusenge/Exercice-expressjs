const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

router.get("/", authenticate, requireRole("SUPER_ADMIN", "BOSS"), async (req, res) => {
  const params = await query(
    "SELECT id, cle, valeur, type_valeur, description FROM parametres_systeme WHERE tenant_id = ?",
    [req.tenantId]
  );
  return R.success(res, params);
});

router.get("/:cle", authenticate, async (req, res) => {
  const rows = await query(
    "SELECT cle, valeur, type_valeur FROM parametres_systeme WHERE tenant_id = ? AND cle = ?",
    [req.tenantId, req.params.cle]
  );
  if (!rows.length) return R.notFound(res, "Paramètre introuvable");
  return R.success(res, rows[0]);
});

router.put("/:cle", authenticate, requireRole("SUPER_ADMIN", "BOSS"), async (req, res) => {
  const { valeur } = req.body;
  await query(
    `INSERT INTO parametres_systeme (tenant_id, cle, valeur)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)`,
    [req.tenantId, req.params.cle, valeur]
  );
  return R.success(res, null, "Paramètre mis à jour");
});

module.exports = router;