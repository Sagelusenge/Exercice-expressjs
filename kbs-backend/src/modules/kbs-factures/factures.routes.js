const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");

const buildFallbackReference = () => {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `KBS-FAC-${year}-${stamp}`;
};

router.post(
  "/",
  authenticate,
  enforceTenant,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  logActivity("KBS", "FACTURE_CREEE"),
  async (req, res) => {
    const { locataire_id, periode_debut, periode_fin, montant_loyer, devise, notes_admin } = req.body;
    
    const locataireId = parseInt(locataire_id, 10);
    const tenantId = parseInt(req.tenantId, 10);
    const creePar = parseInt(req.user.id, 10);
    const amount = Number(String(montant_loyer).replace(",", "."));

    if (!Number.isInteger(locataireId) || locataireId <= 0) {
      return R.badRequest(res, "Locataire invalide");
    }
    if (!periode_debut || !periode_fin) {
      return R.badRequest(res, "La période de la facture est obligatoire");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return R.badRequest(res, "Le montant du loyer doit être supérieur à 0");
    }
    if (new Date(periode_debut) > new Date(periode_fin)) {
      return R.badRequest(res, "La date de début doit être avant la date de fin");
    }

    const locs = await query(
      "SELECT id FROM kbs_locataires WHERE id = CAST(? AS SIGNED) AND tenant_id = CAST(? AS SIGNED) AND deleted_at IS NULL",
      [locataireId, tenantId]
    );
    if (!locs.length) return R.notFound(res, "Locataire introuvable");

    const result = await query(
      `INSERT INTO kbs_factures
       (reference, tenant_id, locataire_id, periode_debut, periode_fin,
        montant_loyer, devise, notes_admin, cree_par)
       VALUES (?, CAST(? AS SIGNED), CAST(? AS SIGNED), ?, ?, ?, ?, ?, CAST(? AS SIGNED))`,
      [buildFallbackReference(), tenantId, locataireId, periode_debut, periode_fin,
       amount, devise || "USD", notes_admin || null, creePar]
    );

    const [facture] = await query(
      "SELECT * FROM v_factures_kbs WHERE id = ? AND tenant_id = ?", [result.insertId, tenantId]
    );
    return R.created(res, facture, "Facture créée");
  }
);

router.get(
  "/",
  authenticate,
  enforceTenant,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const { statut, locataire_id, page = 1, limit = 20 } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    let where = "WHERE tenant_id = ?";
    const params = [req.tenantId];
    if (statut)       { where += " AND statut = ?";       params.push(statut); }
    if (locataire_id) { where += " AND locataire_id = ?"; params.push(locataire_id); }

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM v_factures_kbs ${where}`, params
    );
    const factures = await query(
      `SELECT * FROM v_factures_kbs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    return R.paginated(res, factures, buildPagination(total, page, l));
  }
);

router.get("/mes-factures", authenticate, enforceTenant, requireRole("LOCATAIRE"), async (req, res) => {
  const rows = await query(
    `SELECT vf.*
     FROM v_factures_kbs vf
     JOIN kbs_locataires kl ON kl.id = vf.locataire_id
     WHERE kl.user_id = ? AND vf.tenant_id = ?
     ORDER BY vf.created_at DESC`,
    [req.user.id, req.tenantId]
  );
  return R.success(res, rows);
});

router.get("/:id", authenticate, enforceTenant, async (req, res) => {
  const rows = await query(
    "SELECT * FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
    [req.params.id, req.tenantId]
  );
  if (!rows.length) return R.notFound(res, "Facture introuvable");
  return R.success(res, rows[0]);
});

router.put(
  "/:id",
  authenticate,
  enforceTenant,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  logActivity("KBS", "FACTURE_MODIFIEE"),
  async (req, res) => {
    const { periode_debut, periode_fin, montant_loyer, devise, notes_admin } = req.body;
    const amount = montant_loyer !== undefined && montant_loyer !== ""
      ? Number(String(montant_loyer).replace(",", "."))
      : null;

    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      return R.badRequest(res, "Le montant du loyer doit être supérieur à 0");
    }
    if (periode_debut && periode_fin && new Date(periode_debut) > new Date(periode_fin)) {
      return R.badRequest(res, "La date de début doit être avant la date de fin");
    }

    const [facture] = await query(
      "SELECT id, montant_paye FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    if (!facture) return R.notFound(res, "Facture introuvable");
    if (amount !== null && Number(facture.montant_paye) > amount) {
      return R.badRequest(res, "Le nouveau montant ne peut pas être inférieur au montant déjà payé");
    }

    await query(
      `UPDATE kbs_factures SET
       periode_debut = COALESCE(?, periode_debut),
       periode_fin = COALESCE(?, periode_fin),
       montant_loyer = COALESCE(?, montant_loyer),
       devise = COALESCE(?, devise),
       notes_admin = COALESCE(?, notes_admin)
       WHERE id = ? AND tenant_id = ?`,
      [periode_debut || null, periode_fin || null, amount, devise || null, notes_admin || null, req.params.id, req.tenantId]
    );

    const [updated] = await query(
      "SELECT * FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    return R.success(res, updated, "Facture mise à jour");
  }
);

router.patch(
  "/:id/valider",
  authenticate,
  enforceTenant,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  logActivity("KBS", "FACTURE_VALIDEE"),
  async (req, res) => {
    const { pdf_url } = req.body;
    const result = await query(
      `UPDATE kbs_factures
       SET statut = 'VALIDEE',
           peut_telecharger = 1,
           pdf_url = COALESCE(?, pdf_url),
           date_validation = NOW(),
           valide_par = ?,
           date_rejet = NULL,
           rejete_par = NULL,
           motif_rejet = NULL
       WHERE id = ? AND tenant_id = ?`,
      [pdf_url || null, req.user.id, req.params.id, req.tenantId]
    );
    if (!result.affectedRows) return R.notFound(res, "Facture introuvable");

    const rows = await query(
      "SELECT * FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    const [locataire] = await query(
      `SELECT kl.user_id FROM kbs_factures kf
       JOIN kbs_locataires kl ON kl.id = kf.locataire_id
       WHERE kf.id = ? AND kf.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );
    if (locataire) {
      await notificationService.sendActionNotification(req.tenantId, locataire.user_id, {
        titre: "Facture validee",
        message: `Votre facture ${rows[0]?.reference || ""} est validee et disponible.`,
        module: "KBS",
        type: "FACTURE_VALIDEE",
        emailSubject: "Facture KBS validee",
        donnees_supplementaires: { facture_id: Number(req.params.id) },
      });
    }
    return R.success(res, rows[0], "Facture validée et disponible au téléchargement");
  }
);

router.patch(
  "/:id/rejeter",
  authenticate,
  enforceTenant,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  logActivity("KBS", "FACTURE_REJETEE"),
  async (req, res) => {
    const { motif } = req.body;
    const result = await query(
      `UPDATE kbs_factures
       SET statut = 'REJETEE',
           peut_telecharger = 0,
           date_rejet = NOW(),
           rejete_par = ?,
           motif_rejet = ?,
           date_validation = NULL,
           valide_par = NULL
       WHERE id = ? AND tenant_id = ?`,
      [req.user.id, motif || "Rejete par l'administration", req.params.id, req.tenantId]
    );
    if (!result.affectedRows) return R.notFound(res, "Facture introuvable");

    const rows = await query(
      "SELECT * FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    const [locataire] = await query(
      `SELECT kl.user_id FROM kbs_factures kf
       JOIN kbs_locataires kl ON kl.id = kf.locataire_id
       WHERE kf.id = ? AND kf.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );
    if (locataire) {
      await notificationService.sendActionNotification(req.tenantId, locataire.user_id, {
        titre: "Facture rejetee",
        message: `Votre facture ${rows[0]?.reference || ""} a ete rejetee. Motif: ${motif || "non precise"}.`,
        module: "KBS",
        type: "FACTURE_REJETEE",
        emailSubject: "Facture KBS rejetee",
        donnees_supplementaires: { facture_id: Number(req.params.id) },
      });
    }
    return R.success(res, rows[0], "Facture rejetée");
  }
);

router.get("/:id/historique", authenticate, enforceTenant, async (req, res) => {
  const data = await query(
    `SELECT h.*, CONCAT(u.nom,' ',u.prenom) AS acteur, u.role
     FROM kbs_facture_historique h
     JOIN users u ON u.id = h.effectue_par
     WHERE h.facture_id = ?
     ORDER BY h.created_at DESC`,
    [req.params.id]
  );
  return R.success(res, data);
});

router.get("/:id/telecharger", authenticate, enforceTenant, async (req, res) => {
  const rows = await query(
    "SELECT * FROM kbs_factures WHERE id = ? AND tenant_id = ?",
    [req.params.id, req.tenantId]
  );
  if (!rows.length) return R.notFound(res, "Facture introuvable");
  const facture = rows[0];

  if (!facture.peut_telecharger) {
    return R.forbidden(res, "Cette facture n'est pas encore disponible au téléchargement");
  }

  const actionType = ["SUPER_ADMIN","BOSS","GERANT"].includes(req.user.role)
    ? "TELECHARGEMENT_ADMIN"
    : "TELECHARGEMENT_LOCATAIRE";

  await query(
    `INSERT INTO kbs_facture_historique
     (facture_id, action, effectue_par, ancien_statut, nouveau_statut, commentaire)
     VALUES (?, ?, ?, ?, ?, 'Téléchargement')`,
    [req.params.id, actionType, req.user.id, facture.statut, facture.statut]
  );

  return R.success(res, { pdf_url: facture.pdf_url, reference: facture.reference });
});

module.exports = router;
