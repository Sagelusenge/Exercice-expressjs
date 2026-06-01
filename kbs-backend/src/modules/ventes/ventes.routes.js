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

const nullIfUndefined = (value) => value === undefined ? null : value;

router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  async (req, res) => {
    const { statut, page = 1, limit = 20 } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    let where = "WHERE tenant_id = ?";
    const params = [req.tenantId];
    if (statut) { where += " AND statut = ?"; params.push(statut); }

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM v_ventes_detail ${where}`, params
    );
    const ventes = await query(
      `SELECT * FROM v_ventes_detail ${where} ORDER BY date_vente DESC LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );
    return R.paginated(res, ventes, buildPagination(total, page, l));
  }
);

router.get("/rapport-financier", authenticate, requireRole("SUPER_ADMIN", "BOSS"), enforceTenant, async (req, res) => {
  const data = await query(
    `SELECT * FROM v_rapport_financier_ventes
     WHERE nom_organisation = (SELECT nom_organisation FROM tenants WHERE id = ?)`,
    [req.tenantId]
  );
  return R.success(res, data);
});

router.get("/mes-achats", authenticate, requireRole("CLIENT"), enforceTenant, async (req, res) => {
  const ventes = await query(
    `SELECT * FROM v_ventes_detail WHERE user_id = ? AND tenant_id = ?`,
    [req.user.id, req.tenantId]
  );
  return R.success(res, ventes);
});

router.get("/:id", authenticate, enforceTenant, async (req, res) => {
  const rows = await query(
    "SELECT * FROM v_ventes_detail WHERE id = ? AND tenant_id = ?",
    [req.params.id, req.tenantId]
  );
  if (!rows.length) return R.notFound(res, "Vente introuvable");
  return R.success(res, rows[0]);
});

router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("VENTES", "VENTE_CREEE"),
  async (req, res) => {
    const {
      user_id,
      parcelle_id,
      reservation_id,
      montant_total,
      devise,
      notes,
      montant_paye_initial,
      mode_paiement,
      reference_transaction,
    } = req.body;
    const [parcelle] = await query(
      "SELECT id, reference, titre, statut FROM parcelles WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [parcelle_id, req.tenantId]
    );
    if (!parcelle) return R.notFound(res, "Parcelle introuvable");
    if (["VENDUE", "ARCHIVEE"].includes(parcelle.statut)) {
      return R.badRequest(res, "Cette parcelle ne peut pas être vendue");
    }
    if (!["USD", "CDF"].includes(devise || "USD")) {
      return R.badRequest(res, "Devise invalide");
    }
    const reference = await sequenceService.referenceVente(req.tenantId);
    const result = await query(
      `INSERT INTO ventes
       (reference, tenant_id, user_id, parcelle_id, reservation_id, montant_total, devise, notes, valide_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reference, req.tenantId, user_id, parcelle_id, reservation_id || null,
       montant_total, devise || "USD", notes, req.user.id]
    );
    const tranche = Number(montant_paye_initial || 0);
    if (Number.isFinite(tranche) && tranche > 0) {
      const paiementReference = await sequenceService.referencePaiement(req.tenantId);
      await query(
        `INSERT INTO paiements
         (reference, tenant_id, user_id, parcelle_id, reservation_id, vente_id, montant, devise,
          mode_paiement, reference_transaction, statut, valide_par, date_paiement, date_validation, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAYE', ?, NOW(), NOW(), ?)`,
        [
          paiementReference,
          req.tenantId,
          user_id,
          parcelle_id,
          reservation_id || null,
          result.insertId,
          tranche,
          devise || "USD",
          mode_paiement || "CASH",
          reference_transaction || null,
          req.user.id,
          "Paiement initial enregistre avec la vente",
        ]
      );
      await query(
        "UPDATE ventes SET montant_paye = LEAST(?, montant_total), statut = IF(? >= montant_total, 'COMPLETE', 'EN_COURS') WHERE id = ?",
        [tranche, tranche, result.insertId]
      );
      if (tranche >= Number(montant_total)) {
        await query(
          "UPDATE parcelles SET statut = 'VENDUE', vendu_a = ?, date_vente = NOW() WHERE id = ? AND tenant_id = ?",
          [user_id, parcelle_id, req.tenantId]
        );
      }
    }

    await notificationService.sendActionNotification(req.tenantId, user_id, {
      titre: "Vente de parcelle enregistree",
      message: `Votre achat de la parcelle ${parcelle.reference || parcelle.titre} a ete enregistre. Montant du: ${montant_total} ${devise || "USD"}.`,
      module: "PARCELLES",
      type: "VENTE_CREEE",
      emailSubject: "Vente de parcelle enregistree",
      donnees_supplementaires: { vente_id: result.insertId, parcelle_id },
    });

    const [vente] = await query("SELECT * FROM ventes WHERE id = ?", [result.insertId]);
    return R.created(res, vente, "Vente créée");
  }
);

router.patch(
  "/:id/confirmer",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("VENTES", "VENTE_CONFIRMEE"),
  async (req, res) => {
    try {
      const [vente] = await query("SELECT * FROM ventes WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
      if (!vente) return R.notFound(res, "Vente introuvable");
      if (vente.montant_paye < vente.montant_total) {
        return R.badRequest(res, "Le paiement total n'a pas encore été effectué.");
      }
      await query(
        "UPDATE ventes SET statut = 'COMPLETE', valide_par = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?",
        [req.user.id, req.params.id, req.tenantId]
      );
      await query(
        "UPDATE parcelles SET statut = 'VENDUE', vendu_a = ?, date_vente = NOW(), updated_at = NOW() WHERE id = ? AND tenant_id = ?",
        [vente.user_id, vente.parcelle_id, req.tenantId]
      );
    } catch (err) {
      if (err.message && err.message.includes("ERREUR KBS:")) {
        return R.badRequest(res, err.message.replace("ERREUR KBS:", ""));
      }
      throw err;
    }
    const rows = await query(
      "SELECT * FROM v_ventes_detail WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    if (rows[0]) {
      await notificationService.sendActionNotification(req.tenantId, rows[0].user_id, {
        titre: "Vente confirmee",
        message: `Votre commande pour la parcelle ${rows[0].reference || rows[0].titre_parcelle || ""} a ete validee.`,
        module: "PARCELLES",
        type: "VENTE_CONFIRMEE",
        emailSubject: "Validation de votre commande KBS",
        donnees_supplementaires: { vente_id: Number(req.params.id) },
      });
    }
    return R.success(res, rows[0], "Vente confirmée avec succès");
  }
);

router.post(
  "/:id/documents",
  authenticate,
  enforceTenant,
  async (req, res) => {
    const { type_document, nom_fichier, url_fichier } = req.body;
    const codeDoc = await sequenceService.referenceVenteDocument(req.tenantId);
    const result = await query(
      `INSERT INTO vente_documents (code_doc, vente_id, user_id, type_document, nom_fichier, url_fichier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codeDoc, req.params.id, req.user.id, type_document, nom_fichier, url_fichier]
    );
    return R.created(res, { id: result.insertId }, "Document ajouté à la vente");
  }
);

router.put(
  "/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("VENTES", "VENTE_MODIFIEE"),
  async (req, res) => {
    const { montant_total, devise, notes, statut } = req.body;
    await query(
      `UPDATE ventes SET 
       montant_total = COALESCE(?, montant_total),
       devise = COALESCE(?, devise),
       notes = COALESCE(?, notes),
       statut = COALESCE(?, statut)
       WHERE id = ? AND tenant_id = ?`,
      [
        nullIfUndefined(montant_total),
        nullIfUndefined(devise),
        nullIfUndefined(notes),
        nullIfUndefined(statut),
        req.params.id,
        req.tenantId,
      ]
    );
    return R.success(res, null, "Vente mise à jour");
  }
);

router.delete(
  "/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("VENTES", "VENTE_SUPPRIMEE"),
  async (req, res) => {
    await query("DELETE FROM ventes WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
    return R.success(res, null, "Vente supprimée");
  }
);

module.exports = router;
