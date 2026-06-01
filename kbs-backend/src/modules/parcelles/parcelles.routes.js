const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { query, callProcedure } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate, optionalAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "parcelle-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

// ── Routes publiques ──────────────────────────────────────

// GET /parcelles — Liste publique
router.get("/", enforceTenant, async (req, res) => {
  const { ville, commune, superficie_min, superficie_max,
          type_parcelle, search, page = 1, limit = 10 } = req.query;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE p.tenant_id = ? AND p.deleted_at IS NULL AND p.statut != 'ARCHIVEE'";
  const params = [req.tenantId];

  if (ville)          { where += " AND p.ville LIKE ?";          params.push(`%${ville}%`); }
  if (commune)        { where += " AND p.commune LIKE ?";        params.push(`%${commune}%`); }
  if (superficie_min) { where += " AND p.superficie >= ?";       params.push(superficie_min); }
  if (superficie_max) { where += " AND p.superficie <= ?";       params.push(superficie_max); }
  if (type_parcelle)  { where += " AND p.type_parcelle = ?";     params.push(type_parcelle); }
  if (search) {
    where += " AND (p.titre LIKE ? OR p.localisation LIKE ? OR p.quartier LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM parcelles p ${where}`, params);

  const parcelles = await query(
    `SELECT p.*,
            (SELECT url_image FROM parcelle_images WHERE parcelle_id = p.id LIMIT 1) as image_principale
     FROM parcelles p
     ${where}
     ORDER BY p.est_vedette DESC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return R.paginated(res, parcelles, buildPagination(total, page, l));
});

// GET /parcelles/populaires
router.get("/populaires", enforceTenant, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const data = await query(
    `SELECT p.*,
            (SELECT url_image FROM parcelle_images WHERE parcelle_id = p.id LIMIT 1) as image_principale
     FROM parcelles p
     WHERE p.tenant_id = ? AND p.deleted_at IS NULL AND p.statut != 'ARCHIVEE'
     ORDER BY p.nombre_vues DESC
     LIMIT ?`,
    [req.tenantId, limit]
  );
  return R.success(res, data);
});

// GET /parcelles/recherche
router.get("/recherche", enforceTenant, async (req, res) => {
  const { ville, commune, superficie_min, superficie_max, type_parcelle } = req.query;
  // Fallback si la procédure n'existe pas
  try {
    const results = await callProcedure("CALL sp_recherche_parcelles(?, ?, ?, ?, ?, ?)", [
      req.tenantId,
      ville || null,
      commune || null,
      superficie_min || null,
      superficie_max || null,
      type_parcelle || null,
    ]);
    return R.success(res, Array.isArray(results[0]) ? results[0] : results);
  } catch (e) {
    const data = await query("SELECT * FROM parcelles WHERE tenant_id = ? AND deleted_at IS NULL", [req.tenantId]);
    return R.success(res, data);
  }
});

// GET /parcelles/:id/public
router.get("/:id/public", enforceTenant, async (req, res) => {
  try {
    await query(
      "UPDATE parcelles SET nombre_vues = nombre_vues + 1 WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
  } catch (e) {}

  const parcelles = await query(
    `SELECT p.*,
            (SELECT GROUP_CONCAT(url_image ORDER BY ordre SEPARATOR ',') FROM parcelle_images WHERE parcelle_id = p.id) AS images
     FROM parcelles p
     WHERE p.id = ? AND p.tenant_id = ?
       AND p.statut != 'ARCHIVEE' AND p.deleted_at IS NULL`,
    [req.params.id, req.tenantId]
  );

  if (!parcelles.length) return R.notFound(res, "Parcelle introuvable");
  return R.success(res, parcelles[0]);
});

// ── Routes Admin ──────────────────────────────────────────

// GET /parcelles/admin/liste
router.get("/admin/liste", authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, async (req, res) => {
  const { search, type, statut, page = 1, limit = 10 } = req.query;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE p.tenant_id = ? AND p.deleted_at IS NULL";
  const params = [req.tenantId];

  if (type)   { where += " AND p.type_parcelle = ?"; params.push(type); }
  if (statut) { where += " AND p.statut = ?";        params.push(statut); }
  if (search) {
    where += " AND (p.reference LIKE ? OR p.titre LIKE ? OR p.localisation LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM parcelles p ${where}`, params);
  const data = await query(
    `SELECT p.* FROM parcelles p ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return R.paginated(res, data, buildPagination(total, page, l));
});

// GET /parcelles/:id/admin
router.get("/:id/admin", authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, async (req, res) => {
  const parcelles = await query(
    `SELECT p.*,
            (SELECT GROUP_CONCAT(url_image ORDER BY ordre SEPARATOR ',') FROM parcelle_images WHERE parcelle_id = p.id) AS images
     FROM parcelles p
     WHERE p.id = ? AND p.tenant_id = ? AND p.deleted_at IS NULL`,
    [req.params.id, req.tenantId]
  );

  if (!parcelles.length) return R.notFound(res, "Parcelle introuvable");
  return R.success(res, parcelles[0]);
});

// Valeurs valides pour type_parcelle et statut
const VALID_TYPES = ['RESIDENTIELLE', 'COMMERCIALE', 'AGRICOLE', 'INDUSTRIELLE', 'AUTRE'];
const VALID_STATUTS = ['DISPONIBLE', 'RESERVEE', 'VENDUE', 'MAINTENANCE', 'MASQUEE', 'ARCHIVEE', 'A_AMORCELLER'];

// POST /parcelles — créer
router.post("/", upload.single("photo"), authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, logActivity("PARCELLES", "PARCELLE_CREEE"), async (req, res) => {
  try {
    const data = req.body;
    console.log('Creating parcelle with data:', data, 'File:', req.file);
    
    // Valider type_parcelle
    let typeParcelle = data.type_parcelle;
    if (!VALID_TYPES.includes(typeParcelle)) {
      typeParcelle = 'RESIDENTIELLE';
    }

    // Générer une référence unique si pas fournie
    let reference = data.reference || data.code_parcelle;
    if (!reference) {
      // Compter le nombre de parcelles existantes pour ce tenant
      const [countResult] = await query(
        'SELECT COUNT(*) as count FROM parcelles WHERE tenant_id = ?',
        [req.tenantId]
      );
      const nextNumber = countResult.count + 1;
      reference = `KBS-PARC-${String(nextNumber).padStart(4, '0')}`;
    }

    const result = await query(
      `INSERT INTO parcelles (tenant_id, reference, titre, description, localisation, ville, commune, quartier, superficie, type_parcelle, prix_vente_confidentiel, statut, latitude, longitude, est_vedette, publie_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        reference,
        data.titre || data.nom,
        data.description || null,
        data.localisation || null,
        data.ville,
        data.commune || null,
        data.quartier || null,
        data.superficie,
        typeParcelle,
        data.prix_vente || null,
        data.statut || 'DISPONIBLE',
        data.latitude || null,
        data.longitude || null,
        data.est_vedette || 0,
        req.user.id
      ]
    );
    
    const parcelleId = result.insertId;
    
    // If we have a photo, save it to parcelle_images
    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      await query(
        `INSERT INTO parcelle_images (parcelle_id, url_image, ordre) VALUES (?, ?, 1)`,
        [parcelleId, imageUrl]
      );
    }

    return R.created(res, { id: parcelleId, reference }, "Parcelle créée");
  } catch (error) {
    console.error('Error creating parcelle:', error);
    return R.error(res, error.message || "Erreur lors de la création de la parcelle");
  }
});

// PUT /parcelles/:id — modifier
router.put("/:id", upload.single("photo"), authenticate, requireRole("SUPER_ADMIN", "BOSS", "GERANT"), enforceTenant, logActivity("PARCELLES", "PARCELLE_MODIFIEE"), async (req, res) => {
  const data = req.body;
  
  // Valider type_parcelle
  let typeParcelle = data.type_parcelle;
  if (!VALID_TYPES.includes(typeParcelle)) {
    typeParcelle = 'RESIDENTIELLE';
  }

  await query(
    `UPDATE parcelles SET reference = COALESCE(?, reference), titre = COALESCE(?, titre), description = COALESCE(?, description), localisation = COALESCE(?, localisation), ville = COALESCE(?, ville), commune = COALESCE(?, commune), quartier = COALESCE(?, quartier), superficie = COALESCE(?, superficie), type_parcelle = ?, prix_vente_confidentiel = COALESCE(?, prix_vente_confidentiel), statut = COALESCE(?, statut), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), est_vedette = COALESCE(?, est_vedette)
     WHERE id = ? AND tenant_id = ?`,
    [
      data.reference || data.code_parcelle || null,
      data.titre || data.nom,
      data.description || null,
      data.localisation || null,
      data.ville,
      data.commune || null,
      data.quartier || null,
      data.superficie,
      typeParcelle,
      data.prix_vente || null,
      data.statut,
      data.latitude || null,
      data.longitude || null,
      data.est_vedette,
      req.params.id,
      req.tenantId
    ]
  );
  
  // If we have a new photo, update parcelle_images
  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Check if there's already a main image (ordre=1)
    const [existingImage] = await query(
      `SELECT id FROM parcelle_images WHERE parcelle_id = ? AND ordre = 1`,
      [req.params.id]
    );
    
    if (existingImage) {
      // Update existing image
      await query(
        `UPDATE parcelle_images SET url_image = ? WHERE id = ?`,
        [imageUrl, existingImage.id]
      );
    } else {
      // Insert new image
      await query(
        `INSERT INTO parcelle_images (parcelle_id, url_image, ordre) VALUES (?, ?, 1)`,
        [req.params.id, imageUrl]
      );
    }
  }
  
  return R.success(res, null, "Parcelle mise à jour");
});

// DELETE /parcelles/:id
router.delete("/:id", authenticate, requireRole("SUPER_ADMIN", "BOSS"), enforceTenant, logActivity("PARCELLES", "PARCELLE_SUPPRIMEE"), async (req, res) => {
  await query("UPDATE parcelles SET deleted_at = NOW(), statut = 'ARCHIVEE' WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
  return R.success(res, null, "Parcelle supprimée");
});

module.exports = router;
