const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");
const sequenceService = require("../../services/sequence.service");

router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("KBS", "PAIEMENT_LOYER_CREE"),
  async (req, res) => {
    const {
      locataire_id, facture_id, montant_paye, devise,
      mode_paiement, reference_paiement, preuve_url, notes,
    } = req.body;

    let locataireId = locataire_id ? parseInt(locataire_id, 10) : null;
    let factureId = facture_id ? parseInt(facture_id, 10) : null;
    const amount = Number(String(montant_paye).replace(",", "."));
    let factureDevise = devise || "USD";
    let factureReste = null;

    if (!locataireId) return R.badRequest(res, "Sélectionnez un locataire");

    const [locataire] = await query(
      "SELECT id FROM kbs_locataires WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [locataireId, req.tenantId]
    );
    if (!locataire) return R.notFound(res, "Locataire introuvable");

    if (!factureId) {
      const [openFacture] = await query(
        `SELECT id
         FROM v_factures_kbs
         WHERE tenant_id = ?
           AND locataire_id = ?
           AND statut <> 'REJETEE'
           AND montant_restant > 0
         ORDER BY periode_debut ASC, created_at ASC
         LIMIT 1`,
        [req.tenantId, locataireId]
      );
      factureId = openFacture?.id || null;
    }

    if (factureId) {
      const [facture] = await query(
        "SELECT id, locataire_id, devise, montant_loyer, montant_restant FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
        [factureId, req.tenantId]
      );
      if (!facture) return R.notFound(res, "Facture introuvable");
      if (Number(facture.locataire_id) !== Number(locataireId)) {
        return R.badRequest(res, "La facture ne correspond pas au locataire sélectionné");
      }
      locataireId = facture.locataire_id;
      factureDevise = facture.devise || factureDevise;
      factureReste = Number(facture.montant_restant);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return R.badRequest(res, "Le montant payé doit être supérieur à 0");
    }
    if (Number.isFinite(factureReste) && amount > factureReste) {
      return R.badRequest(res, "Le montant payé dépasse le reste à payer");
    }
    if (!mode_paiement) return R.badRequest(res, "Le mode de paiement est obligatoire");

    const reference = await sequenceService.referencePaiementLoyer(req.tenantId);
    const result = await query(
      `INSERT INTO kbs_paiements_loyer
       (reference, tenant_id, locataire_id, facture_id, montant_paye, devise,
        mode_paiement, reference_paiement, preuve_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference,
        req.tenantId, locataireId, factureId || null,
        amount, factureDevise, mode_paiement,
        reference_paiement, preuve_url, notes,
      ]
    );
    const [paiement] = await query(
      "SELECT * FROM kbs_paiements_loyer WHERE id = ?", [result.insertId]
    );
    return R.created(res, paiement, "Paiement de loyer enregistré");
  }
);

router.get(
  "/rapport-mensuel",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const data = await query(
      "SELECT * FROM v_paiements_loyer_mensuel WHERE tenant_id = ? ORDER BY annee DESC, mois DESC",
      [req.tenantId]
    );
    return R.success(res, data);
  }
);

router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const { locataire_id, statut, page = 1, limit = 20 } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    let where = "WHERE kp.tenant_id = ?";
    const params = [req.tenantId];
    if (locataire_id) { where += " AND kp.locataire_id = ?"; params.push(locataire_id); }
    if (statut)       { where += " AND kp.statut = ?";       params.push(statut); }

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM kbs_paiements_loyer kp ${where}`, params
    );
    const paiements = await query(
      `SELECT kp.*,
              kf.reference AS facture_reference,
              vf.montant_loyer,
              vf.montant_paye AS facture_montant_paye,
              vf.montant_restant,
              CASE kl.categorie WHEN 'SIMPLE' THEN CONCAT(kl.nom,' ',kl.prenom)
              ELSE kl.nom_entreprise END AS nom_locataire,
              kl.code_locataire
       FROM kbs_paiements_loyer kp
       JOIN kbs_locataires kl ON kl.id = kp.locataire_id
       LEFT JOIN kbs_factures kf ON kf.id = kp.facture_id
       LEFT JOIN v_factures_kbs vf ON vf.id = kp.facture_id
       ${where} ORDER BY kp.created_at DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    return R.paginated(res, paiements, buildPagination(total, page, l));
  }
);

router.get("/mes-paiements", authenticate, requireRole("LOCATAIRE"), enforceTenant, async (req, res) => {
  const paiements = await query(
    `SELECT kp.* FROM kbs_paiements_loyer kp
     JOIN kbs_locataires kl ON kl.id = kp.locataire_id
     WHERE kl.user_id = ? AND kp.tenant_id = ?
     ORDER BY kp.created_at DESC`,
    [req.user.id, req.tenantId]
  );
  return R.success(res, paiements);
});

router.patch(
  "/:id/valider",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("KBS", "PAIEMENT_LOYER_VALIDE"),
  async (req, res) => {
    const [paiement] = await query(
      `SELECT kp.id, kp.facture_id, kp.montant_paye, kp.devise, vf.montant_restant, kl.user_id
       FROM kbs_paiements_loyer kp
       JOIN kbs_locataires kl ON kl.id = kp.locataire_id
       LEFT JOIN v_factures_kbs vf ON vf.id = kp.facture_id
       WHERE kp.id = ? AND kp.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );
    if (!paiement) return R.notFound(res, "Paiement introuvable");
    if (paiement.facture_id) {
      const resteAvantValidation = Number(paiement.montant_restant) + Number(paiement.montant_paye);
      if (Number(paiement.montant_paye) > resteAvantValidation) {
        return R.badRequest(res, "Le paiement dépasse le reste à payer");
      }
    }

    await query(
      `UPDATE kbs_paiements_loyer SET statut = 'VALIDE', valide_par = ?,
       date_paiement = NOW(), date_validation = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [req.user.id, req.params.id, req.tenantId]
    );
    await notificationService.sendActionNotification(req.tenantId, paiement.user_id, {
      titre: "Paiement de loyer valide",
      message: `Votre paiement de loyer de ${paiement.montant_paye} ${paiement.devise} a ete valide.`,
      module: "KBS",
      type: "PAIEMENT_LOYER_VALIDE",
      emailSubject: "Validation de votre paiement de loyer",
      donnees_supplementaires: { paiement_id: Number(req.params.id), facture_id: paiement.facture_id },
    });
    return R.success(res, null, "Paiement de loyer validé");
  }
);

router.patch(
  "/:id/rejeter",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("KBS", "PAIEMENT_LOYER_REJETE"),
  async (req, res) => {
    await query(
      "UPDATE kbs_paiements_loyer SET statut = 'REJETE', valide_par = ? WHERE id = ? AND tenant_id = ?",
      [req.user.id, req.params.id, req.tenantId]
    );
    return R.success(res, null, "Paiement rejeté");
  }
);

router.put(
  "/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("KBS", "PAIEMENT_LOYER_MODIFIE"),
  async (req, res) => {
    const { montant_paye, devise, mode_paiement, reference_paiement, notes, statut } = req.body;
    await query(
      `UPDATE kbs_paiements_loyer SET
       montant_paye = COALESCE(?, montant_paye),
       devise = COALESCE(?, devise),
       mode_paiement = COALESCE(?, mode_paiement),
       reference_paiement = COALESCE(?, reference_paiement),
       notes = COALESCE(?, notes),
       statut = COALESCE(?, statut)
       WHERE id = ? AND tenant_id = ?`,
      [montant_paye, devise, mode_paiement, reference_paiement, notes, statut, req.params.id, req.tenantId]
    );
    return R.success(res, null, "Paiement mis à jour");
  }
);

router.delete(
  "/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("KBS", "PAIEMENT_LOYER_SUPPRIME"),
  async (req, res) => {
    await query("DELETE FROM kbs_paiements_loyer WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
    return R.success(res, null, "Paiement supprimé");
  }
);

module.exports = router;
