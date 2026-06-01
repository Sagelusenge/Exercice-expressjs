const { query } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const sequenceService = require("../../services/sequence.service");
const { notificationService } = require("../../services/notification.service");

const createFacture = async (tenantId, adminId, data) => {
  const { locataire_id, periode_debut, periode_fin, montant_loyer, devise, notes_admin } = data;

  const locs = await query(
    "SELECT id FROM kbs_locataires WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
    [locataire_id, tenantId]
  );
  if (!locs.length) throw { status: 404, message: "Locataire introuvable" };

  const reference = await sequenceService.referenceFacture(tenantId);
  const result = await query(
    `INSERT INTO kbs_factures
     (reference, tenant_id, locataire_id, periode_debut, periode_fin,
      montant_loyer, devise, notes_admin, cree_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reference,
      tenantId,
      locataire_id,
      periode_debut,
      periode_fin,
      montant_loyer,
      devise || "USD",
      notes_admin,
      adminId,
    ]
  );

  await query(
    `INSERT INTO kbs_facture_historique
     (facture_id, action, effectue_par, ancien_statut, nouveau_statut, commentaire)
     VALUES (?, 'CREATION', ?, NULL, 'EN_ATTENTE', 'Creation de la facture')`,
    [result.insertId, adminId]
  );

  return getById(tenantId, result.insertId);
};

const listFactures = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { statut, locataire_id } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE tenant_id = ?";
  const params = [tenantId];

  if (statut) { where += " AND statut = ?"; params.push(statut); }
  if (locataire_id) { where += " AND locataire_id = ?"; params.push(locataire_id); }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_factures_kbs ${where}`,
    params
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

const validerFacture = async (factureId, adminId, pdfUrl) => {
  const [facture] = await query("SELECT * FROM kbs_factures WHERE id = ?", [factureId]);
  if (!facture) throw { status: 404, message: "Facture introuvable" };
  if (facture.statut === "VALIDEE") throw { status: 400, message: "Facture deja validee" };

  await query(
    `UPDATE kbs_factures
     SET statut = 'VALIDEE', date_validation = NOW(), valide_par = ?,
         pdf_url = COALESCE(?, pdf_url), peut_telecharger = 1,
         date_rejet = NULL, rejete_par = NULL, motif_rejet = NULL
     WHERE id = ?`,
    [adminId, pdfUrl || null, factureId]
  );

  await query(
    `INSERT INTO kbs_facture_historique
     (facture_id, action, effectue_par, ancien_statut, nouveau_statut, commentaire)
     VALUES (?, 'VALIDATION', ?, ?, 'VALIDEE', 'Facture validee')`,
    [factureId, adminId, facture.statut]
  );

  const [locataire] = await query(
    `SELECT u.id AS user_id
     FROM kbs_locataires kl
     JOIN users u ON u.id = kl.user_id
     WHERE kl.id = ?`,
    [facture.locataire_id]
  );
  if (locataire) {
    await notificationService.createNotification({
      tenantId: facture.tenant_id,
      userId: locataire.user_id,
      type: "FACTURE",
      titre: "Facture validee",
      message: `Votre facture ${facture.reference} est disponible.`,
      canal: "IN_APP",
      priorite: "NORMALE",
      entiteType: "KBS_FACTURE",
      entiteId: factureId,
    });
  }
};

const rejeterFacture = async (factureId, adminId, motif) => {
  const [facture] = await query("SELECT * FROM kbs_factures WHERE id = ?", [factureId]);
  if (!facture) throw { status: 404, message: "Facture introuvable" };
  if (facture.statut === "REJETEE") throw { status: 400, message: "Facture deja rejetee" };

  await query(
    `UPDATE kbs_factures
     SET statut = 'REJETEE', date_rejet = NOW(), rejete_par = ?,
         motif_rejet = ?, peut_telecharger = 0
     WHERE id = ?`,
    [adminId, motif || "Facture rejetee", factureId]
  );

  await query(
    `INSERT INTO kbs_facture_historique
     (facture_id, action, effectue_par, ancien_statut, nouveau_statut, commentaire)
     VALUES (?, 'REJET', ?, ?, 'REJETEE', ?)`,
    [factureId, adminId, facture.statut, motif || "Facture rejetee"]
  );
};

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

const telechargerFacture = async (tenantId, factureId, userId, roleUser) => {
  const rows = await query(
    "SELECT * FROM kbs_factures WHERE id = ? AND tenant_id = ?",
    [factureId, tenantId]
  );

  if (!rows.length) throw { status: 404, message: "Facture introuvable" };
  const facture = rows[0];

  if (!facture.peut_telecharger) {
    throw { status: 403, message: "Cette facture n'est pas encore disponible au telechargement" };
  }

  const actionType = ["SUPER_ADMIN", "BOSS", "GERANT"].includes(roleUser)
    ? "TELECHARGEMENT_ADMIN"
    : "TELECHARGEMENT_LOCATAIRE";

  await query(
    `INSERT INTO kbs_facture_historique
     (facture_id, action, effectue_par, ancien_statut, nouveau_statut, commentaire)
     VALUES (?, ?, ?, ?, ?, 'Telechargement de la facture')`,
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
