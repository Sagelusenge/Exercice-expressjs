const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const sequenceService = require("../../services/sequence.service");

router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN"),
  async (req, res) => {
    const {
      nom_organisation, slug, email_organisation, telephone, adresse,
      module_parcelles_actif, module_kbs_actif,
      module_chat_actif, module_reservation_actif,
    } = req.body;

    const result = await query(
      `INSERT INTO tenants
       (code_tenant, nom_organisation, slug, email_organisation, telephone, adresse,
        module_parcelles_actif, module_kbs_actif,
        module_chat_actif, module_reservation_actif)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        await sequenceService.codeTenant(),
        nom_organisation, slug, email_organisation, telephone, adresse,
        module_parcelles_actif ?? 1, module_kbs_actif ?? 1,
        module_chat_actif ?? 1, module_reservation_actif ?? 0,
      ]
    );
    const [tenant] = await query("SELECT * FROM tenants WHERE id = ?", [result.insertId]);
    return R.created(res, tenant, "Organisation créée");
  }
);

router.get("/", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  const tenants = await query("SELECT * FROM tenants ORDER BY created_at DESC");
  return R.success(res, tenants);
});

router.get("/current", authenticate, async (req, res) => {
  const rows = await query(
    `SELECT id, code_tenant, nom_organisation, slug, email_organisation,
            telephone, adresse, logo_url, statut,
            module_parcelles_actif, module_kbs_actif,
            module_chat_actif, module_reservation_actif
     FROM tenants WHERE id = ?`,
    [req.tenantId]
  );
  return R.success(res, rows[0]);
});

router.patch(
  "/:id/modules",
  authenticate,
  requireRole("SUPER_ADMIN"),
  async (req, res) => {
    const {
      module_parcelles_actif, module_kbs_actif,
      module_chat_actif, module_reservation_actif,
    } = req.body;
    await query(
      `UPDATE tenants SET
       module_parcelles_actif    = COALESCE(?, module_parcelles_actif),
       module_kbs_actif          = COALESCE(?, module_kbs_actif),
       module_chat_actif         = COALESCE(?, module_chat_actif),
       module_reservation_actif  = COALESCE(?, module_reservation_actif)
       WHERE id = ?`,
      [
        module_parcelles_actif, module_kbs_actif,
        module_chat_actif, module_reservation_actif,
        req.params.id,
      ]
    );
    return R.success(res, null, "Modules mis à jour");
  }
);

module.exports = router;
