const { query } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const sequenceService = require("../../services/sequence.service");

const listPubliques = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { ville, commune, superficie_min, superficie_max, type_parcelle, search } = filters;
  const { offset, limit: l } = paginate(page, limit);

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
    `SELECT COUNT(*) AS total FROM v_parcelles_admin ${where}`,
    params
  );

  const parcelles = await query(
    `SELECT * FROM v_parcelles_admin ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { parcelles, pagination: buildPagination(total, page, l) };
};

const getPublicDetail = async (tenantId, parcelleId) => {
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

  const parcelle = parcelles[0];
  delete parcelle.prix_vente_confidentiel;
  return parcelle;
};

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

const createParcelle = async (tenantId, adminId, data) => {
  const {
    titre, description, localisation, ville, commune, quartier,
    superficie, devise, type_parcelle, latitude, longitude,
    prix_vente_confidentiel, est_vedette,
  } = data;
  const typeParcelle = type_parcelle || "RESIDENTIELLE";
  const reference = await sequenceService.referenceParcelle({ tenantId, typeParcelle });

  const result = await query(
    `INSERT INTO parcelles
     (tenant_id, reference, titre, description, localisation, ville, commune, quartier,
      superficie, devise, type_parcelle, latitude, longitude,
      prix_vente_confidentiel, est_vedette, publie_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId, reference, titre, description, localisation, ville, commune, quartier,
      superficie, devise || "USD", typeParcelle,
      latitude, longitude, prix_vente_confidentiel, est_vedette || 0, adminId,
    ]
  );

  return getAdminDetail(tenantId, result.insertId);
};

const updateParcelle = async (tenantId, parcelleId, data) => {
  const fields = [
    "titre", "description", "localisation", "ville", "commune",
    "quartier", "superficie", "devise", "type_parcelle", "statut",
    "latitude", "longitude", "prix_vente_confidentiel", "est_vedette",
  ];

  const sets = fields.filter((f) => data[f] !== undefined).map((f) => `${f} = ?`);
  const values = fields.filter((f) => data[f] !== undefined).map((f) => data[f]);

  if (!sets.length) throw { status: 400, message: "Aucun champ a mettre a jour" };

  await query(
    `UPDATE parcelles SET ${sets.join(", ")}
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [...values, parcelleId, tenantId]
  );

  return getAdminDetail(tenantId, parcelleId);
};

const addImage = async (parcelleId, urlImage, estPrincipale = false, ordre = 0) => {
  if (estPrincipale) {
    await query("UPDATE parcelle_images SET est_principale = 0 WHERE parcelle_id = ?", [parcelleId]);
  }

  const [parcelle] = await query("SELECT tenant_id FROM parcelles WHERE id = ?", [parcelleId]);
  if (!parcelle) throw { status: 404, message: "Parcelle introuvable" };
  const codeImage = await sequenceService.referenceParcelleImage(parcelle.tenant_id);

  const result = await query(
    `INSERT INTO parcelle_images (code_image, parcelle_id, url_image, est_principale, ordre)
     VALUES (?, ?, ?, ?, ?)`,
    [codeImage, parcelleId, urlImage, estPrincipale ? 1 : 0, ordre]
  );

  return result.insertId;
};

const addDocument = async (parcelleId, data) => {
  const { type_document, nom_fichier, url_fichier, est_public } = data;
  const [parcelle] = await query("SELECT tenant_id FROM parcelles WHERE id = ?", [parcelleId]);
  if (!parcelle) throw { status: 404, message: "Parcelle introuvable" };
  const codeDocument = await sequenceService.referenceParcelleDocument(parcelle.tenant_id);

  const result = await query(
    `INSERT INTO parcelle_documents
     (code_document, parcelle_id, type_document, nom_fichier, url_fichier, est_public)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [codeDocument, parcelleId, type_document, nom_fichier, url_fichier, est_public ? 1 : 0]
  );

  return result.insertId;
};

const deleteParcelle = async (tenantId, parcelleId) => {
  await query(
    "UPDATE parcelles SET deleted_at = NOW(), statut = 'ARCHIVEE' WHERE id = ? AND tenant_id = ?",
    [parcelleId, tenantId]
  );
};

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

const rechercheAvancee = async (tenantId, filters) => {
  let where = "WHERE tenant_id = ? AND statut = 'DISPONIBLE' AND deleted_at IS NULL";
  const params = [tenantId];

  if (filters.ville) { where += " AND ville LIKE ?"; params.push(`%${filters.ville}%`); }
  if (filters.commune) { where += " AND commune LIKE ?"; params.push(`%${filters.commune}%`); }
  if (filters.superficie_min) { where += " AND superficie >= ?"; params.push(filters.superficie_min); }
  if (filters.superficie_max) { where += " AND superficie <= ?"; params.push(filters.superficie_max); }
  if (filters.type_parcelle) { where += " AND type_parcelle = ?"; params.push(filters.type_parcelle); }

  return query(`SELECT * FROM parcelles ${where} ORDER BY est_vedette DESC, created_at DESC`, params);
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
