const { query, withTransaction } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");

/**
 * Créer une réservation
 * Les triggers BD gèrent :
 * - trg_reservation_before_insert : génère référence + date_expiration
 * - trg_reservation_check_disponible : vérifie disponibilité
 * - trg_reservation_after_insert : passe parcelle en RESERVEE + log
 */
const createReservation = async (tenantId, userId, data) => {
  const { parcelle_id, montant_reservation, devise, notes_client, date_expiration } = data;

  try {
    const result = await query(
      `INSERT INTO reservations
       (tenant_id, user_id, parcelle_id, montant_reservation, devise, notes_client, date_expiration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, parcelle_id, montant_reservation || 0, devise || "USD",
       notes_client, date_expiration || null]
    );

    return getById(tenantId, result.insertId);
  } catch (err) {
    // Les triggers BD génèrent des messages KBS explicites
    if (err.message && err.message.includes("ERREUR KBS:")) {
      throw { status: 400, message: err.message.replace("ERREUR KBS: ", "") };
    }
    throw err;
  }
};

/**
 * Lister les réservations — utilise v_reservations_actives pour les actives
 */
const listReservations = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { statut, user_id, parcelle_id } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE r.tenant_id = ?";
  const params = [tenantId];

  if (statut) { where += " AND r.statut = ?"; params.push(statut); }
  if (user_id) { where += " AND r.user_id = ?"; params.push(user_id); }
  if (parcelle_id) { where += " AND r.parcelle_id = ?"; params.push(parcelle_id); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM reservations r ${where}`, params
  );

  // Vue v_reservations_actives pour les actives
  const reservations = await query(
    `SELECT r.*, 
            CONCAT(u.nom,' ',u.prenom) AS nom_client,
            u.code_user, u.email, u.telephone,
            p.reference AS ref_parcelle, p.titre AS titre_parcelle,
            p.ville, p.commune
     FROM reservations r
     JOIN users u ON u.id = r.user_id
     JOIN parcelles p ON p.id = r.parcelle_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { reservations, pagination: buildPagination(total, page, l) };
};

/**
 * Obtenir les réservations actives (vue BD)
 */
const getReservationsActives = async (tenantId) => {
  return query(
    "SELECT * FROM v_reservations_actives WHERE tenant_id = ?",
    [tenantId]
  );
};

const getById = async (tenantId, id) => {
  const rows = await query(
    `SELECT r.*,
            CONCAT(u.nom,' ',u.prenom) AS nom_client,
            u.code_user, u.email, u.telephone,
            p.reference AS ref_parcelle, p.titre AS titre_parcelle
     FROM reservations r
     JOIN users u ON u.id = r.user_id
     JOIN parcelles p ON p.id = r.parcelle_id
     WHERE r.id = ? AND r.tenant_id = ?`,
    [id, tenantId]
  );
  if (!rows.length) throw { status: 404, message: "Réservation introuvable" };
  return rows[0];
};

/**
 * Mettre à jour le statut d'une réservation
 * Le trigger trg_reservation_after_update gère :
 * - EXPIREE/ANNULEE → parcelle DISPONIBLE
 * - TRANSFORMEE_EN_VENTE → parcelle VENDUE
 */
const updateStatut = async (tenantId, id, statut, adminId, notes_admin = null) => {
  const statutsValides = [
    "EN_COURS", "CONFIRMEE", "EXPIREE", "ANNULEE", "TRANSFORMEE_EN_VENTE"
  ];

  if (!statutsValides.includes(statut)) {
    throw { status: 400, message: "Statut invalide" };
  }

  await query(
    `UPDATE reservations SET statut = ?, traite_par = ?, notes_admin = COALESCE(?, notes_admin)
     WHERE id = ? AND tenant_id = ?`,
    [statut, adminId, notes_admin, id, tenantId]
  );

  return getById(tenantId, id);
};

/**
 * Annuler une réservation (par le client lui-même)
 */
const annulerParClient = async (tenantId, id, userId) => {
  const res = await getById(tenantId, id);

  if (res.user_id !== userId) {
    throw { status: 403, message: "Vous ne pouvez annuler que vos propres réservations" };
  }

  if (!["EN_ATTENTE", "EN_COURS"].includes(res.statut)) {
    throw { status: 400, message: "Cette réservation ne peut plus être annulée" };
  }

  await query(
    "UPDATE reservations SET statut = 'ANNULEE' WHERE id = ? AND tenant_id = ?",
    [id, tenantId]
  );

  return getById(tenantId, id);
};

module.exports = {
  createReservation,
  listReservations,
  getReservationsActives,
  getById,
  updateStatut,
  annulerParClient,
};