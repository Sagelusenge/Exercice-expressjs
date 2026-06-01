const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");
const sequenceService = require("../../services/sequence.service");
const emailService = require("../../services/email.service");
const EmailTemplates = require("../../services/email.templates");

router.post(
  "/",
  authenticate,
  requireRole("CLIENT"),
  logActivity("PARCELLES", "VISITE_DEMANDEE"),
  async (req, res) => {
    const { parcelle_id, date_souhaitee, heure_souhaitee, notes_client } = req.body;
    const reference = await sequenceService.referenceVisite(req.tenantId);
    const result = await query(
      `INSERT INTO visites_demandes
       (reference, tenant_id, user_id, parcelle_id, date_souhaitee, heure_souhaitee, notes_client)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reference, req.tenantId, req.user.id, parcelle_id, date_souhaitee, heure_souhaitee, notes_client]
    );
    const [visite] = await query("SELECT * FROM visites_demandes WHERE id = ?", [result.insertId]);
    
    // Send confirmation email
    try {
      const [parcelle] = await query(
        "SELECT * FROM parcelles WHERE id = ? AND tenant_id = ?",
        [parcelle_id, req.tenantId]
      );
      
      if (parcelle && req.user.email) {
        const htmlBody = EmailTemplates.visiteRequested(visite, parcelle, req.user);
        await emailService.sendEmail(req.user.email, "Demande de visite enregistrée KBS", htmlBody);
      }
    } catch (emailErr) {
      console.error("Erreur envoi email confirmation visite:", emailErr);
    }
    
    return R.created(res, visite, "Demande de visite enregistrée");
  }
);

router.get("/", authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), async (req, res) => {
  const { statut, page = 1, limit = 20 } = req.query;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE v.tenant_id = ?";
  const params = [req.tenantId];
  if (statut) { where += " AND v.statut = ?"; params.push(statut); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM visites_demandes v ${where}`, params
  );
  const visites = await query(
    `SELECT v.*, CONCAT(u.nom,' ',u.prenom) AS nom_client,
            p.titre AS titre_parcelle, p.reference AS ref_parcelle
     FROM visites_demandes v
     JOIN users u ON u.id = v.user_id
     JOIN parcelles p ON p.id = v.parcelle_id
     ${where} ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );
  return R.paginated(res, visites, buildPagination(total, page, l));
});

router.get("/mes-visites", authenticate, requireRole("CLIENT"), async (req, res) => {
  const visites = await query(
    `SELECT v.*, p.titre AS titre_parcelle, p.reference AS ref_parcelle
     FROM visites_demandes v
     JOIN parcelles p ON p.id = v.parcelle_id
     WHERE v.user_id = ? AND v.tenant_id = ?
     ORDER BY v.created_at DESC`,
    [req.user.id, req.tenantId]
  );
  return R.success(res, visites);
});

router.patch(
  "/:id/statut",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const { statut, notes_admin } = req.body;
    const [visite] = await query(
      "SELECT user_id FROM visites_demandes WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    await query(
      `UPDATE visites_demandes SET statut = ?, traite_par = ?, notes_admin = ?
       WHERE id = ? AND tenant_id = ?`,
      [statut, req.user.id, notes_admin, req.params.id, req.tenantId]
    );
    if (visite) {
      await notificationService.sendActionNotification(req.tenantId, visite.user_id, {
        titre: "Visite mise a jour",
        message: `Votre demande de visite est maintenant: ${statut}.`,
        module: "PARCELLES",
        type: `VISITE_${statut}`,
        emailSubject: "Mise a jour de votre visite KBS",
        donnees_supplementaires: { visite_id: Number(req.params.id), statut },
      });
    }
    return R.success(res, null, `Visite ${statut}`);
  }
);

module.exports = router;
