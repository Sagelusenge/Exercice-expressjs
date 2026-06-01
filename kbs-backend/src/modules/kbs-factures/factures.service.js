const { query, callProcedure } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");

/**
 * Créer une facture
 * Les triggers BD :
 * - trg_facture_before_insert : génère référence KBS-FAC-[ANNEE]-[NUM]
 * - trg_facture_after_insert : crée historique automatique (CREATION)
 */
const createFacture = async (tenantId, adminId, data) => {
  const { locataire_id, periode_debut, periode_fin, montant_loyer, devise, notes_admin } = data;

  // Vérifier que le locataire appartient au tenant
  const locs = await query(
    "SELECT id FROM kbs_locataires WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
    [locataire_id, tenantId]
  );
  if (!locs.length) throw { status: 404, message: "Locataire introuvable" };

  const result = await query(
    `INSERT INTO kbs_factures
     (tenant_id, locataire_id, periode_debut, periode_fin,
      montant_loyer, devise, notes_admin, cree_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, locataire_id, periode_debut, periode_fin,
     montant_loyer, devise || "USD", notes_admin, adminId]
  );

  return getById(tenantId, result.insertId);
};

/**
 * Lister — utilise la vue v_factures_kbs
 */
const listFactures = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { statut, locataire_id } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE tenant_id = ?";
  const params = [tenantId];

  if (statut) { where += " AND statut = ?"; params.push(statut); }
  if (locataire_id) { where += " AND locataire_id = ?"; params.push(locataire_id); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_factures_kbs ${where}`, params
  );

  const factures = await query(
    `SELECT * FROM v_factures_kbs ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { factures, pagination: buildPagination(total, page, l) };
};

const getById = async (tenantId, id) => {
  const rows = await query(
    "SELECT * FROM v_factures_kbs WHERE id = ? AND tenant_id = ?",
    [id, tenantId]
  );
  if (!rows.length) throw { status: 404, message: "Facture introuvable" };
  return rows[0];
};

/**
 * Valider une facture — utilise la PROCÉDURE sp_valider_facture
 * La procédure :
 * - Vérifie rôle admin
 * - Passe statut VALIDEE, peut_telecharger = 1
 * - Envoie notification locataire
 * - Le trigger trg_facture_after_update enregistre dans historique
 */
const validerFacture = async (factureId, adminId, pdfUrl) => {
  try {
    await callProcedure("CALL sp_valider_facture(?, ?, ?)", [factureId, adminId, pdfUrl]);
  } catch (err) {
    if (err.message && err.message.includes("ERREUR KBS:")) {
      throw { status: 400, message: err.message.replace("ERREUR KBS: ", "") };
    }
    throw err;
  }
};

/**
 * Rejeter une facture — utilise la PROCÉDURE sp_rejeter_facture
 */
const rejeterFacture = async (factureId, adminId, motif) => {
  try {
    await callProcedure("CALL sp_rejeter_facture(?, ?, ?)", [factureId, adminId, motif]);
  } catch (err) {
    if (err.message && err.message.includes("ERREUR KBS:")) {
      throw { status: 400, message: err.message.replace("ERREUR KBS: ", "") };
    }
    throw err;
  }
};

/**
 * Historique d'une facture — table kbs_facture_historique
 */
const getHistorique = async (factureId) => {
  return query(
    `SELECT h.*, CONCAT(u.nom,' ',u.prenom) AS acteur, u.role
     FROM kbs_facture_historique h
     JOIN users u ON u.id = h.effectue_par
     WHERE h.facture_id = ?
     ORDER BY h.created_at DESC`,
    [factureId]
  );
};

/**
 * Télécharger une facture
 * Vérifie peut_telecharger = 1
 * Enregistre dans kbs_facture_historique l'action TELECHARGEMENT
 */
const telechargerFacture = async (tenantId, factureId, userId, roleUser) => {
  const rows = await query(
    "SELECT * FROM kbs_factures WHERE id = ? AND tenant_id = ?",
    [factureId, tenantId]
  );

  if (!rows.length) throw { status: 404, message: "Facture introuvable" };
  const facture = rows[0];

  if (!facture.peut_telecharger) {
    throw { status: 403, message: "Cette facture n'est pas encore disponible au téléchargement" };
  }

  const actionType = ["SUPER_ADMIN", "BOSS", "GERANT"].includes(roleUser)
    ? "TELECHARGEMENT_ADMIN"
    : "TELECHARGEMENT_LOCATAIRE";

  // Enregistrer dans l'historique
  await query(
    `INSERT INTO kbs_facture_historique
     (facture_id, action, effectue_par, ancien_statut, nouveau_statut, commentaire)
     VALUES (?, ?, ?, ?, ?, 'Téléchargement de la facture')`,
    [factureId, actionType, userId, facture.statut, facture.statut]
  );

  return facture;
};

module.exports = {
  createFacture,
  listFactures,
  getById,
  validerFacture,
  rejeterFacture,
  getHistorique,
  telechargerFacture,
};