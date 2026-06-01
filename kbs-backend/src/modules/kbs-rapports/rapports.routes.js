const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const sequenceService = require("../../services/sequence.service");

router.get(
  "/mensuel",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const mois  = parseInt(req.query.mois)  || new Date().getMonth() + 1;
    const annee = parseInt(req.query.annee) || new Date().getFullYear();

    const results = await query(
      `SELECT
        kl.code_locataire,
        kl.categorie,
        COALESCE(CONCAT(kl.nom,' ',kl.prenom), kl.nom_entreprise) AS locataire,
        COALESCE(kl.telephone_personnel, kl.telephone_entreprise) AS telephone,
        kl.date_debut_loyer,
        kl.date_fin_loyer,
        kl.montant_mensuel_loyer,
        kl.devise,
        kl.statut_paiement,
        COALESCE(SUM(kp.montant_paye), 0) AS montant_paye_mois,
        CASE
          WHEN COALESCE(SUM(kp.montant_paye),0) >= kl.montant_mensuel_loyer THEN 'PAYE'
          WHEN COALESCE(SUM(kp.montant_paye),0) > 0 THEN 'PARTIEL'
          ELSE 'NON PAYE'
        END AS statut_mois
       FROM kbs_locataires kl
       LEFT JOIN kbs_paiements_loyer kp
         ON kp.locataire_id = kl.id
        AND kp.statut = 'VALIDE'
        AND MONTH(kp.date_paiement) = ?
        AND YEAR(kp.date_paiement) = ?
       WHERE kl.tenant_id = ? AND kl.deleted_at IS NULL
       GROUP BY kl.id
       ORDER BY kl.categorie, statut_mois`,
      [mois, annee, req.tenantId]
    );
    return R.success(res, results, `Rapport mensuel ${mois}/${annee}`);
  }
);

router.post(
  "/generer",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const { type_rapport, periode_debut, periode_fin, format } = req.body;
    const reference = await sequenceService.referenceRapport(req.tenantId);
    const result = await query(
      `INSERT INTO kbs_rapports
       (reference, tenant_id, type_rapport, periode_debut, periode_fin, genere_par, format)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reference, req.tenantId, type_rapport, periode_debut, periode_fin, req.user.id, format || "PDF"]
    );
    const [rapport] = await query("SELECT * FROM kbs_rapports WHERE id = ?", [result.insertId]);
    return R.created(res, rapport, "Rapport enregistré");
  }
);

router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const rapports = await query(
      `SELECT r.*, CONCAT(u.nom,' ',u.prenom) AS genere_par_nom
       FROM kbs_rapports r
       JOIN users u ON u.id = r.genere_par
       WHERE r.tenant_id = ?
       ORDER BY r.created_at DESC`,
      [req.tenantId]
    );
    return R.success(res, rapports);
  }
);

module.exports = router;
