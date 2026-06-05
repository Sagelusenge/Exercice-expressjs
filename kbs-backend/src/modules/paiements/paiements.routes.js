const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");

router.post(
  "/",
  authenticate,
  enforceTenant,
  logActivity("VENTES", "PAIEMENT_CREE"),
  async (req, res) => {
    const {
      vente_id, reservation_id, parcelle_id,
      montant, devise, mode_paiement,
      reference_transaction, preuve_paiement_url, notes,
    } = req.body;

    const result = await query(
      `INSERT INTO paiements
       (tenant_id, user_id, parcelle_id, reservation_id, vente_id,
        montant, devise, mode_paiement, reference_transaction,
        preuve_paiement_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, req.user.id, parcelle_id || null,
        reservation_id || null, vente_id || null,
        montant, devise || "USD", mode_paiement,
        reference_transaction, preuve_paiement_url, notes,
      ]
    );
    const [paiement] = await query("SELECT * FROM paiements WHERE id = ?", [result.insertId]);
    return R.created(res, paiement, "Paiement enregistré en attente de validation");
  }
);

router.get("/", authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, async (req, res) => {
  const { statut, page = 1, limit = 20 } = req.query;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE p.tenant_id = ?";
  const params = [req.tenantId];
  if (statut) { where += " AND p.statut = ?"; params.push(statut); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM paiements p ${where}`, params
  );
  const paiements = await query(
    `SELECT p.*, CONCAT(u.nom,' ',u.prenom) AS nom_client, u.code_user
     FROM paiements p
     JOIN users u ON u.id = p.user_id
     ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );
  return R.paginated(res, paiements, buildPagination(total, page, l));
});

router.get("/mes-paiements", authenticate, requireRole("CLIENT"), enforceTenant, async (req, res) => {
  const paiements = await query(
    "SELECT * FROM paiements WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC",
    [req.tenantId, req.user.id]
  );
  return R.success(res, paiements);
});

router.patch(
  "/:id/valider",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("VENTES", "PAIEMENT_VALIDE"),
  async (req, res) => {
    // Get the payment first
    const [paiement] = await query("SELECT * FROM paiements WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
    
    if (!paiement) return R.notFound(res, "Paiement introuvable");
    
    // Update payment status
    await query(
      `UPDATE paiements SET statut = 'PAYE', valide_par = ?,
       date_paiement = NOW(), date_validation = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [req.user.id, req.params.id, req.tenantId]
    );
    
    // If payment is linked to a sale, update sale's montant_paye
    if (paiement.vente_id) {
      const [vente] = await query("SELECT * FROM ventes WHERE id = ? AND tenant_id = ?", [paiement.vente_id, req.tenantId]);
      
      if (vente) {
        // Increment montant_paye and update statut in one query
        await query(
          `UPDATE ventes 
           SET montant_paye = montant_paye + ?,
               statut = IF(montant_paye + ? >= montant_total, 'COMPLETE', 'EN_COURS')
           WHERE id = ? AND tenant_id = ?`,
          [paiement.montant, paiement.montant, paiement.vente_id, req.tenantId]
        );
        
        // Check if vente is now COMPLETE to update parcelle
        const [updatedVente] = await query("SELECT * FROM ventes WHERE id = ? AND tenant_id = ?", [paiement.vente_id, req.tenantId]);
        
        if (updatedVente && updatedVente.statut === 'COMPLETE') {
          // Set parcelle to VENDUE
          await query(
            `UPDATE parcelles SET statut = 'VENDUE', vendu_a = ?, date_vente = NOW() WHERE id = ? AND tenant_id = ?`,
            [updatedVente.user_id, updatedVente.parcelle_id, req.tenantId]
          );
        }
      }
    }
    
    // Get updated payment
    const [updatedPaiement] = await query("SELECT * FROM paiements WHERE id = ?", [req.params.id]);
    await notificationService.sendActionNotification(req.tenantId, paiement.user_id, {
      titre: "Paiement valide",
      message: `Votre paiement de ${paiement.montant} ${paiement.devise} a ete valide.`,
      module: "PARCELLES",
      type: "PAIEMENT_VALIDE",
      emailSubject: "Validation de votre paiement KBS",
      donnees_supplementaires: { paiement_id: Number(req.params.id), vente_id: paiement.vente_id },
    });
    return R.success(res, updatedPaiement, "Paiement validé");
  }
);

router.patch(
  "/:id/rejeter",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  enforceTenant,
  logActivity("VENTES", "PAIEMENT_REJETE"),
  async (req, res) => {
    // Get the payment first
    const [paiement] = await query("SELECT * FROM paiements WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
    
    if (!paiement) return R.notFound(res, "Paiement introuvable");
    
    // Update payment status
    await query(
      "UPDATE paiements SET statut = 'ANNULE', valide_par = ? WHERE id = ? AND tenant_id = ?",
      [req.user.id, req.params.id, req.tenantId]
    );
    
    // If payment was previously PAYE and linked to a sale, decrement montant_paye
    if (paiement.statut === "PAYE" && paiement.vente_id) {
      const [vente] = await query("SELECT * FROM ventes WHERE id = ? AND tenant_id = ?", [paiement.vente_id, req.tenantId]);
      
      if (vente) {
        // Decrement montant_paye, but don't go below 0
        await query(
          `UPDATE ventes SET montant_paye = GREATEST(montant_paye - ?, 0) WHERE id = ? AND tenant_id = ?`,
          [paiement.montant, paiement.vente_id, req.tenantId]
        );
        
        // If sale was COMPLETE and now not anymore, set back to EN_COURS
        const [updatedVente] = await query("SELECT * FROM ventes WHERE id = ? AND tenant_id = ?", [paiement.vente_id, req.tenantId]);
        
        if (updatedVente && updatedVente.statut === "COMPLETE" && updatedVente.montant_paye < updatedVente.montant_total) {
          await query(
            `UPDATE ventes SET statut = 'EN_COURS' WHERE id = ? AND tenant_id = ?`,
            [paiement.vente_id, req.tenantId]
          );
          
          // Set parcelle back to DISPONIBLE? Wait, let's check, or should we? Let's think:
          // Maybe we should, let's set it back to DISPONIBLE, but let's confirm.
          // Let's do it:
          await query(
            `UPDATE parcelles SET statut = 'DISPONIBLE', vendu_a = NULL, date_vente = NULL WHERE id = ? AND tenant_id = ?`,
            [updatedVente.parcelle_id, req.tenantId]
          );
        }
      }
    }
    await notificationService.sendActionNotification(req.tenantId, paiement.user_id, {
      titre: "Paiement rejete",
      message: `Votre paiement de ${paiement.montant} ${paiement.devise} a ete rejete. Veuillez verifier les informations envoyees.`,
      module: "PARCELLES",
      type: "PAIEMENT_REJETE",
      emailSubject: "Paiement KBS rejete",
      donnees_supplementaires: { paiement_id: Number(req.params.id), vente_id: paiement.vente_id },
    });

    return R.success(res, null, "Paiement rejeté");
  }
);

module.exports = router;
