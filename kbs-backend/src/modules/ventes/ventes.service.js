const { query, withTransaction } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const sequenceService = require("../../services/sequence.service");

const createVente = async (tenantId, data, adminId) => {
  const { user_id, parcelle_id, reservation_id, montant_total, devise, notes } = data;
  const reference = await sequenceService.referenceVente(tenantId);

  const result = await query(
    `INSERT INTO ventes
     (reference, tenant_id, user_id, parcelle_id, reservation_id, montant_total, devise, notes, valide_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reference,
      tenantId,
      user_id,
      parcelle_id,
      reservation_id || null,
      montant_total,
      devise || "USD",
      notes,
      adminId,
    ]
  );

  return getById(tenantId, result.insertId);
};

const listVentes = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { statut, user_id } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE tenant_id = ?";
  const params = [tenantId];

  if (statut) { where += " AND statut = ?"; params.push(statut); }
  if (user_id) { where += " AND user_id = ?"; params.push(user_id); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_ventes_detail ${where}`,
    params
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

const confirmerVente = async (venteId, adminId) => {
  await withTransaction(async (conn) => {
    const [[vente]] = await conn.execute(
      "SELECT id, parcelle_id, montant_total, montant_paye, statut FROM ventes WHERE id = ? FOR UPDATE",
      [venteId]
    );

    if (!vente) throw { status: 404, message: "Vente introuvable" };
    if (vente.statut !== "EN_COURS") throw { status: 400, message: "Vente deja traitee" };
    if (Number(vente.montant_paye) < Number(vente.montant_total)) {
      throw { status: 400, message: "Paiement non effectue ou incomplet" };
    }

    await conn.execute(
      "UPDATE ventes SET statut = 'COMPLETE', valide_par = ? WHERE id = ?",
      [adminId, venteId]
    );
    await conn.execute(
      "UPDATE parcelles SET statut = 'VENDUE', vendu_a = (SELECT user_id FROM ventes WHERE id = ?), date_vente = NOW() WHERE id = ?",
      [venteId, vente.parcelle_id]
    );
  });
};

const getRapportFinancier = async (tenantId) => {
  return query(
    "SELECT * FROM v_rapport_financier_ventes WHERE nom_organisation IN (SELECT nom_organisation FROM tenants WHERE id = ?)",
    [tenantId]
  );
};

const addDocument = async (venteId, userId, data) => {
  const { type_document, nom_fichier, url_fichier } = data;
  const [vente] = await query("SELECT tenant_id FROM ventes WHERE id = ?", [venteId]);
  if (!vente) throw { status: 404, message: "Vente introuvable" };
  const codeDoc = await sequenceService.referenceVenteDocument(vente.tenant_id);

  const result = await query(
    `INSERT INTO vente_documents (code_doc, vente_id, user_id, type_document, nom_fichier, url_fichier)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [codeDoc, venteId, userId, type_document, nom_fichier, url_fichier]
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
