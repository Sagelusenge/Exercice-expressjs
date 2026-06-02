const router = require("express").Router();
const { callProcedure, query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

router.get("/admin", authenticate, async (req, res) => {
  const [parcelles] = await query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN statut = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
      SUM(CASE WHEN statut = 'VENDUE' THEN 1 ELSE 0 END) as vendues,
      SUM(CASE WHEN statut = 'RESERVEE' THEN 1 ELSE 0 END) as reservees,
      SUM(CASE WHEN statut = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
      SUM(CASE WHEN statut = 'MASQUEE' THEN 1 ELSE 0 END) as masquees,
      SUM(CASE WHEN statut = 'A_AMORCELLER' THEN 1 ELSE 0 END) as amorceller
    FROM parcelles
    WHERE tenant_id = ?
      AND deleted_at IS NULL
      AND statut <> 'ARCHIVEE'`, [req.tenantId]);

  const [users] = await query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN role = 'CLIENT' THEN 1 ELSE 0 END) as clients,
      SUM(CASE WHEN role = 'LOCATAIRE' THEN 1 ELSE 0 END) as locataires,
      SUM(CASE WHEN statut = 'EN_ATTENTE_VERIFICATION' THEN 1 ELSE 0 END) as en_attente
    FROM users
    WHERE tenant_id = ?
      AND deleted_at IS NULL`, [req.tenantId]);

  const [ventes] = await query(`
    SELECT 
      COUNT(*) as total,
      SUM(montant_total) as revenu_total,
      SUM(CASE WHEN statut = 'COMPLETE' THEN 1 ELSE 0 END) as ventes_completes,
      SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) as en_cours,
      SUM(CASE WHEN statut = 'ANNULEE' THEN 1 ELSE 0 END) as annulees
    FROM ventes
    WHERE tenant_id = ?`, [req.tenantId]);

  const [reservations] = await query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) AS en_attente,
      SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) AS en_cours,
      SUM(CASE WHEN statut = 'CONFIRMEE' THEN 1 ELSE 0 END) AS confirmees,
      SUM(CASE WHEN statut = 'EXPIREE' THEN 1 ELSE 0 END) AS expirees,
      SUM(CASE WHEN statut = 'ANNULEE' THEN 1 ELSE 0 END) AS annulees,
      SUM(CASE WHEN statut = 'TRANSFORMEE_EN_VENTE' THEN 1 ELSE 0 END) AS transformees
    FROM reservations
    WHERE tenant_id = ?`, [req.tenantId]);

  const [loyers] = await query(`
    SELECT 
      COUNT(*) as total_locataires,
      SUM(CASE WHEN statut_paiement = 'A_JOUR' THEN 1 ELSE 0 END) as a_jour,
      SUM(CASE WHEN statut_paiement = 'EN_RETARD' THEN 1 ELSE 0 END) as en_retard
    FROM kbs_locataires
    WHERE tenant_id = ?
      AND deleted_at IS NULL`, [req.tenantId]);

  const [dettes] = await query(`
    SELECT
      COUNT(DISTINCT locataire_id) AS locataires_en_dette,
      COALESCE(SUM(montant_restant), 0) AS dette_totale
    FROM v_factures_kbs
    WHERE tenant_id = ?
      AND statut <> 'REJETEE'
      AND montant_restant > 0`, [req.tenantId]);

  const revenusMensuels = await query(`
    SELECT mois,
           SUM(ventes) AS ventes,
           SUM(loyers) AS loyers
    FROM (
      SELECT DATE_FORMAT(date_vente, '%Y-%m') AS mois,
             SUM(montant_total) AS ventes,
             0 AS loyers
      FROM ventes
      WHERE tenant_id = ?
        AND statut = 'COMPLETE'
        AND date_vente >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY DATE_FORMAT(date_vente, '%Y-%m')
      UNION ALL
      SELECT DATE_FORMAT(COALESCE(date_paiement, created_at), '%Y-%m') AS mois,
             0 AS ventes,
             SUM(montant_paye) AS loyers
      FROM kbs_paiements_loyer
      WHERE tenant_id = ?
        AND statut <> 'REJETE'
        AND COALESCE(date_paiement, created_at) >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY DATE_FORMAT(COALESCE(date_paiement, created_at), '%Y-%m')
    ) revenus
    GROUP BY mois
    ORDER BY mois`, [req.tenantId, req.tenantId]);

  return R.success(res, {
    parcelles,
    users,
    ventes,
    reservations,
    revenus_mensuels: revenusMensuels,
    kbs_loyer: {
      ...loyers,
      locataires_en_dette: dettes.locataires_en_dette || 0,
      dette_totale: dettes.dette_totale || 0,
    }
  });
});

router.get("/activites", authenticate, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const activities = await query(`
    SELECT al.*, u.nom as acteur_nom, u.prenom as acteur_prenom
    FROM activity_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE al.tenant_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?`, [req.tenantId, limit]);
  
  const mappedActivities = activities.map(a => ({
    ...a,
    acteur: a.acteur_nom ? `${a.acteur_nom} ${a.acteur_prenom}` : "Système"
  }));

  return R.success(res, mappedActivities);
});

module.exports = router;
