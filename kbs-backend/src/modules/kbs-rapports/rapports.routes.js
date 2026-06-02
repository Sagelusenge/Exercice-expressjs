const router = require("express").Router();
const { query, callProcedure } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

router.get(
  "/mensuel",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const mois  = parseInt(req.query.mois)  || new Date().getMonth() + 1;
    const annee = parseInt(req.query.annee) || new Date().getFullYear();

    const results = await callProcedure("CALL sp_rapport_mensuel_kbs(?, ?, ?)", [
      req.tenantId, mois, annee,
    ]);
    return R.success(
      res,
      Array.isArray(results[0]) ? results[0] : results,
      `Rapport mensuel ${mois}/${annee}`
    );
  }
);

router.post(
  "/generer",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const { type_rapport, periode_debut, periode_fin, format } = req.body;
    const result = await query(
      `INSERT INTO kbs_rapports
       (tenant_id, type_rapport, periode_debut, periode_fin, genere_par, format)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.tenantId, type_rapport, periode_debut, periode_fin, req.user.id, format || "PDF"]
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