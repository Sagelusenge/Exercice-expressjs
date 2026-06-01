const { query, withTransaction } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");

/**
 * Lister les parcelles publiques — utilise la VUE v_parcelles_publiques
 * SANS PRIX (respecte la BD : prix_vente_confidentiel jamais exposé publiquement)
 */
const listPubliques = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { ville, commune, superficie_min, superficie_max, type_parcelle, search } = filters;
  const { offset, limit: l } = paginate(page, limit);

  // Utilisation de la VUE v_parcelles_publiques
  let where = "WHERE p.tenant_id = ?";
  const params = [tenantId];

  if (ville) { where += " AND ville LIKE ?"; params.push(`%${ville}%`); }
  if (commune) { where += " AND commune LIKE ?"; params.push(`%${commune}%`); }
  if (superficie_min) { where += " AND superficie >= ?"; params.push(superficie_min); }
  if (superficie_max) { where += " AND superficie <= ?"; params.push(superficie_max); }
  if (type_parcelle) { where += " AND type_parcelle = ?"; params.push(type_parcelle); }
  if (search) {
    where += " AND (titre LIKE ? OR localisation LIKE ? OR quartier LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_parcelles_publiques p ${where}`,
    params
  );

  const parcelles = await query(
    `SELECT * FROM v_parcelles_publiques p ${where}
     ORDER BY est_vedette DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { parcelles, pagination: buildPagination(total, page, l) };
};

/**
 * Lister les parcelles pour l'admin — utilise la VUE v_parcelles_admin
 * AVEC PRIX (confidentiel, accès admin uniquement)
 */
const listAdmin = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { statut, type_parcelle, search } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE tenant_id = ?";
  const params = [tenantId];

  if (statut) { where += " AND statut = ?"; params.push(statut); }
  if (type_parcelle) { where += " AND type_parcelle = ?"; params.push(type_parcelle); }
  if (search) {
    where += " AND (titre LIKE ? OR reference LIKE ? OR ville LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_parcelles_admin ${where}`, params
  );

  const parcelles = await query(
    `SELECT * FROM v_parcelles_admin ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { parcelles, pagination: buildPagination(total, page, l) };
};

/**
 * Détail d'une parcelle publique (incrémente nombre_vues)
 */
const getPublicDetail = async (tenantId, parcelleId) => {
  // Incrémenter le compteur de vues
  await query(
    "UPDATE parcelles SET nombre_vues = nombre_vues + 1 WHERE id = ? AND tenant_id = ?",
    [parcelleId, tenantId]
  );

  const parcelles = await query(
    `SELECT p.*, 
            GROUP_CONCAT(DISTINCT pi.url_image ORDER BY pi.ordre) AS images,
            GROUP_CONCAT(DISTINCT CASE WHEN pd.est_public = 1 THEN pd.url_fichier END) AS documents_publics
     FROM parcelles p
     LEFT JOIN parcelle_images pi ON pi.parcelle_id = p.id
     LEFT JOIN parcelle_documents pd ON pd.parcelle_id = p.id
     WHERE p.id = ? AND p.tenant_id = ? AND p.statut != 'ARCHIVEE'
       AND p.deleted_at IS NULL
     GROUP BY p.id`,
    [parcelleId, tenantId]
  );

  if (!parcelles.length) throw { status: 404, message: "Parcelle introuvable" };

  const p = parcelles[0];
  // Ne JAMAIS exposer prix_vente_confidentiel en public
  delete p.prix_vente_confidentiel;

  return p;
};

/**
 * Détail admin (avec prix confidentiel)
 */
const getAdminDetail = async (tenantId, parcelleId) => {
  const parcelles = await query(
    `SELECT p.*,
            JSON_ARRAYAGG(JSON_OBJECT(
              'id', pi.id, 'url', pi.url_image,
              'principale', pi.est_principale, 'ordre', pi.ordre
            )) AS images,
            JSON_ARRAYAGG(JSON_OBJECT(
              'id', pd.id, 'type', pd.type_document,
              'url', pd.url_fichier, 'public', pd.est_public
            )) AS documents
     FROM parcelles p
     LEFT JOIN parcelle_images pi ON pi.parcelle_id = p.id
     LEFT JOIN parcelle_documents pd ON pd.parcelle_id = p.id
     WHERE p.id = ? AND p.tenant_id = ? AND p.deleted_at IS NULL
     GROUP BY p.id`,
    [parcelleId, tenantId]
  );

  if (!parcelles.length) throw { status: 404, message: "Parcelle introuvable" };
  return parcelles[0];
};

/**
 * Créer une parcelle
 * Le trigger trg_parcelle_before_insert génère la référence automatiquement
 */
const createParcelle = async (tenantId, adminId, data) => {
  const {
    titre, description, localisation, ville, commune, quartier,
    superficie, devise, type_parcelle, latitude, longitude,
    prix_vente_confidentiel, est_vedette,
  } = data;

  const result = await query(
    `INSERT INTO parcelles
     (tenant_id, titre, description, localisation, ville, commune, quartier,
      superficie, devise, type_parcelle, latitude, longitude,
      prix_vente_confidentiel, est_vedette, publie_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId, titre, description, localisation, ville, commune, quartier,
      superficie, devise || "USD", type_parcelle || "RESIDENTIELLE",
      latitude, longitude, prix_vente_confidentiel, est_vedette || 0, adminId,
    ]
  );

  return getAdminDetail(tenantId, result.insertId);
};

/**
 * Mettre à jour une parcelle
 */
const updateParcelle = async (tenantId, parcelleId, data) => {
  const fields = [
    "titre", "description", "localisation", "ville", "commune",
    "quartier", "superficie", "devise", "type_parcelle", "statut",
    "latitude", "longitude", "prix_vente_confidentiel", "est_vedette",
  ];

  const sets = fields
    .filter((f) => data[f] !== undefined)
    .map((f) => `${f} = ?`);
  const values = fields.filter((f) => data[f] !== undefined).map((f) => data[f]);

  if (!sets.length) throw { status: 400, message: "Aucun champ à mettre à jour" };

  await query(
    `UPDATE parcelles SET ${sets.join(", ")} 
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [...values, parcelleId, tenantId]
  );

  return getAdminDetail(tenantId, parcelleId);
};

/**
 * Ajouter une image — le trigger génère code_image
 */
const addImage = async (parcelleId, urlImage, estPrincipale = false, ordre = 0) => {
  // Si principale → désactiver les autres
  if (estPrincipale) {
    await query(
      "UPDATE parcelle_images SET est_principale = 0 WHERE parcelle_id = ?",
      [parcelleId]
    );
  }

  const result = await query(
    `INSERT INTO parcelle_images (parcelle_id, url_image, est_principale, ordre)
     VALUES (?, ?, ?, ?)`,
    [parcelleId, urlImage, estPrincipale ? 1 : 0, ordre]
  );

  return result.insertId;
};

/**
 * Ajouter un document — le trigger génère code_document
 */
const addDocument = async (parcelleId, data) => {
  const { type_document, nom_fichier, url_fichier, est_public } = data;

  const result = await query(
    `INSERT INTO parcelle_documents 
     (parcelle_id, type_document, nom_fichier, url_fichier, est_public)
     VALUES (?, ?, ?, ?, ?)`,
    [parcelleId, type_document, nom_fichier, url_fichier, est_public ? 1 : 0]
  );

  return result.insertId;
};

/**
 * Suppression logique (soft delete)
 */
const deleteParcelle = async (tenantId, parcelleId) => {
  await query(
    "UPDATE parcelles SET deleted_at = NOW(), statut = 'ARCHIVEE' WHERE id = ? AND tenant_id = ?",
    [parcelleId, tenantId]
  );
};

/**
 * Parcelles populaires — utilise la VUE v_parcelles_populaires
 */
const getPopulaires = async (tenantId, limit = 10) => {
  return query(
    `SELECT * FROM v_parcelles_populaires 
     WHERE id IN (
       SELECT id FROM parcelles WHERE tenant_id = ? AND deleted_at IS NULL
     )
     LIMIT ?`,
    [tenantId, limit]
  );
};

/**
 * Recherche avancée — utilise la PROCÉDURE sp_recherche_parcelles
 */
const rechercheAvancee = async (tenantId, filters) => {
  const { callProcedure } = require("../../config/database");
  const results = await callProcedure(
    "CALL sp_recherche_parcelles(?, ?, ?, ?, ?, ?)",
    [
      tenantId,
      filters.ville || null,
      filters.commune || null,
      filters.superficie_min || null,
      filters.superficie_max || null,
      filters.type_parcelle || null,
    ]
  );
  // La procédure retourne un tableau de résultats
  return Array.isArray(results[0]) ? results[0] : results;
};

module.exports = {
  listPubliques,
  listAdmin,
  getPublicDetail,
  getAdminDetail,
  createParcelle,
  updateParcelle,
  addImage,
  addDocument,
  deleteParcelle,
  getPopulaires,
  rechercheAvancee,
};