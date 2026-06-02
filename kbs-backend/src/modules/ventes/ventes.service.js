const { query, callProcedure, withTransaction } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");

/**
 * Créer une vente
 * Le trigger trg_vente_before_insert génère la référence
 * montant_restant est une colonne calculée (STORED) : montant_total - montant_paye
 */
const createVente = async (tenantId, data, adminId) => {
  const { user_id, parcelle_id, reservation_id, montant_total, devise, notes } = data;

  const result = await query(
    `INSERT INTO ventes
     (tenant_id, user_id, parcelle_id, reservation_id, montant_total, devise, notes, valide_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, user_id, parcelle_id, reservation_id || null,
     montant_total, devise || "USD", notes, adminId]
  );

  return getById(tenantId, result.insertId);
};

/**
 * Lister — utilise v_ventes_detail
 */
const listVentes = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { statut, user_id } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE tenant_id = ?";
  const params = [tenantId];

  if (statut) { where += " AND statut = ?"; params.push(statut); }
  if (user_id) { where += " AND user_id = ?"; params.push(user_id); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_ventes_detail ${where}`, params
  );

  const ventes = await query(
    `SELECT * FROM v_ventes_detail ${where}
     ORDER BY date_vente DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { ventes, pagination: buildPagination(total, page, l) };
};

const getById = async (tenantId, id) => {
  const rows = await query(
    "SELECT * FROM v_ventes_detail WHERE id = ? AND tenant_id = ?",
    [id, tenantId]
  );
  if (!rows.length) throw { status: 404, message: "Vente introuvable" };
  return rows[0];
};

/**
 * Confirmer une vente — utilise la PROCÉDURE sp_confirmer_vente
 * La procédure vérifie : rôle admin, statut vente, paiement complet
 */
const confirmerVente = async (venteId, adminId) => {
  try {
    await callProcedure("CALL sp_confirmer_vente(?, ?)", [venteId, adminId]);
  } catch (err) {
    if (err.message && err.message.includes("ERREUR KBS:")) {
      throw { status: 400, message: err.message.replace("ERREUR KBS: ", "") };
    }
    throw err;
  }
};

/**
 * Rapport financier — utilise v_rapport_financier_ventes
 */
const getRapportFinancier = async (tenantId) => {
  return query(
    "SELECT * FROM v_rapport_financier_ventes WHERE nom_organisation IN (SELECT nom_organisation FROM tenants WHERE id = ?)",
    [tenantId]
  );
};

/**
 * Ajouter un document de vente — le trigger génère code_doc
 */
const addDocument = async (venteId, userId, data) => {
  const { type_document, nom_fichier, url_fichier } = data;

  const result = await query(
    `INSERT INTO vente_documents (vente_id, user_id, type_document, nom_fichier, url_fichier)
     VALUES (?, ?, ?, ?, ?)`,
    [venteId, userId, type_document, nom_fichier, url_fichier]
  );

  return result.insertId;
};

module.exports = {
  createVente,
  listVentes,
  getById,
  confirmerVente,
  getRapportFinancier,
  addDocument,
};