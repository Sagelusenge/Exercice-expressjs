const router = require("express").Router();
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

router.post("/", authenticate, requireRole("CLIENT"), async (req, res) => {
  const { parcelle_id } = req.body;
  try {
    await query(
      "INSERT INTO favoris (user_id, parcelle_id) VALUES (?, ?)",
      [req.user.id, parcelle_id]
    );
    return R.created(res, null, "Ajouté aux favoris");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return R.badRequest(res, "Déjà dans vos favoris");
    throw err;
  }
});

router.delete("/:parcelle_id", authenticate, requireRole("CLIENT"), async (req, res) => {
  await query(
    "DELETE FROM favoris WHERE user_id = ? AND parcelle_id = ?",
    [req.user.id, req.params.parcelle_id]
  );
  return R.success(res, null, "Retiré des favoris");
});

router.get("/", authenticate, requireRole("CLIENT"), async (req, res) => {
  const favoris = await query(
    `SELECT f.id AS favori_id, f.created_at AS date_ajout,
            p.id, p.reference, p.titre, p.ville, p.commune,
            p.superficie, p.type_parcelle, p.statut, p.nombre_vues,
            pi.url_image AS image_principale
     FROM favoris f
     JOIN parcelles p ON p.id = f.parcelle_id
     LEFT JOIN parcelle_images pi ON pi.parcelle_id = p.id AND pi.est_principale = 1
     WHERE f.user_id = ? AND p.deleted_at IS NULL
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  return R.success(res, favoris);
});

module.exports = router;