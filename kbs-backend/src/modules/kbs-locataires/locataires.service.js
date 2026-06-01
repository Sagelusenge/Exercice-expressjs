const { query } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const bcrypt = require("bcryptjs");
const sequenceService = require("../../services/sequence.service");

/**
 * Créer un locataire
 * Crée AUSSI le compte users avec role=LOCATAIRE (exige cree_par non NULL)
 * Les triggers BD :
 * - trg_user_check_locataire : bloque auto-inscription LOCATAIRE
 * - trg_user_before_insert : génère code_user + module_accessible = KBS
 * - trg_locataire_before_insert : génère code_locataire
 */
const createLocataire = async (tenantId, adminId, data) => {
  const { withTransaction } = require("../../config/database");

  return withTransaction(async (conn) => {
    // 1. Créer le compte user (rôle LOCATAIRE, cree_par = adminId)
    const motDePasseTemp = `Kbs${Math.floor(1000 + Math.random() * 9000)}@`;
    const hash = await bcrypt.hash(motDePasseTemp, 12);

    const emailUser =
      data.categorie === "SIMPLE"
        ? data.email || `${data.nom.toLowerCase()}.${tenantId}@kbs.local`
        : data.email_entreprise;
    const nomUser = data.categorie === "SIMPLE" ? data.nom : data.nom_representant;
    const prenomUser = data.categorie === "SIMPLE" ? data.prenom : "";
    const codeUser = await sequenceService.codeUser({
      tenantId,
      nom: nomUser,
      prenom: prenomUser,
      role: "LOCATAIRE",
    });

    const [userResult] = await conn.execute(
      `INSERT INTO users
       (tenant_id, code_user, module_accessible, nom, prenom, email, telephone, mot_de_passe,
        role, statut, email_verifie, cree_par)
       VALUES (?, ?, 'KBS', ?, ?, ?, ?, ?, 'LOCATAIRE', 'ACTIF', 1, ?)`,
      [
        tenantId,
        codeUser,
        nomUser,
        prenomUser,
        emailUser,
        data.categorie === "SIMPLE" ? data.telephone_personnel : data.telephone_entreprise,
        hash,
        adminId,
      ]
    );

    const userId = userResult.insertId;

    const codeLocataire = await sequenceService.codeLocataire({ tenantId, categorie: data.categorie });
    const [locResult] = await conn.execute(
      `INSERT INTO kbs_locataires
       (code_locataire, tenant_id, user_id, categorie,
        nom, prenom, date_naissance, telephone_personnel, adresse_personnelle,
        type_piece_identite, photo_identite_url, photo_piece_identite_url,
        nom_entreprise, secteur_activite, numero_rccm, numero_nif,
        nom_representant, telephone_entreprise, email_entreprise,
        adresse_siege, numero_local, logo_entreprise_url,
        date_debut_loyer, date_fin_loyer, montant_mensuel_loyer, devise,
        cree_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codeLocataire, tenantId, userId, data.categorie,
        data.nom || null, data.prenom || null,
        data.date_naissance || null, data.telephone_personnel || null,
        data.adresse_personnelle || null, data.type_piece_identite || null,
        data.photo_identite_url || null, data.photo_piece_identite_url || null,
        data.nom_entreprise || null, data.secteur_activite || null,
        data.numero_rccm || null, data.numero_nif || null,
        data.nom_representant || null, data.telephone_entreprise || null,
        data.email_entreprise || null, data.adresse_siege || null,
        data.numero_local || null, data.logo_entreprise_url || null,
        data.date_debut_loyer, data.date_fin_loyer,
        data.montant_mensuel_loyer, data.devise || "USD",
        adminId,
      ]
    );

    const locataireId = locResult.insertId;

    // Récupérer avec les détails
    const [locataire] = await conn.execute(
      "SELECT * FROM v_locataires_kbs WHERE id = ?",
      [locataireId]
    );

    return { locataire: locataire[0], mot_de_passe_temp: motDePasseTemp };
  });
};

/**
 * Lister — utilise la vue v_locataires_kbs
 */
const listLocataires = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { categorie, statut_paiement, alerte_echeance, search } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE tenant_id = ?";
  const params = [tenantId];

  if (categorie) { where += " AND categorie = ?"; params.push(categorie); }
  if (statut_paiement) { where += " AND statut_paiement = ?"; params.push(statut_paiement); }
  if (alerte_echeance) { where += " AND alerte_echeance = ?"; params.push(alerte_echeance); }
  if (search) {
    where += " AND (nom_affichage LIKE ? OR code_locataire LIKE ? OR telephone LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM v_locataires_kbs ${where}`, params
  );

  const locataires = await query(
    `SELECT * FROM v_locataires_kbs ${where}
     ORDER BY alerte_echeance ASC, created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { locataires, pagination: buildPagination(total, page, l) };
};

const getById = async (tenantId, id) => {
  const rows = await query(
    "SELECT * FROM v_locataires_kbs WHERE id = ? AND tenant_id = ?",
    [id, tenantId]
  );
  if (!rows.length) throw { status: 404, message: "Locataire introuvable" };
  return rows[0];
};

const updateLocataire = async (tenantId, id, data) => {
  const fields = [
    "nom", "prenom", "telephone_personnel", "adresse_personnelle",
    "date_debut_loyer", "date_fin_loyer", "montant_mensuel_loyer",
    "nom_entreprise", "telephone_entreprise", "email_entreprise",
    "nom_representant", "adresse_siege", "numero_local",
    "photo_identite_url", "photo_piece_identite_url",
  ];

  const sets = fields.filter((f) => data[f] !== undefined).map((f) => `${f} = ?`);
  const values = fields.filter((f) => data[f] !== undefined).map((f) => data[f]);

  if (!sets.length) throw { status: 400, message: "Aucun champ à mettre à jour" };

  await query(
    `UPDATE kbs_locataires SET ${sets.join(", ")}
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [...values, id, tenantId]
  );

  return getById(tenantId, id);
};

const softDeleteLocataire = async (tenantId, id) => {
  await query(
    "UPDATE kbs_locataires SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?",
    [id, tenantId]
  );
};

module.exports = {
  createLocataire,
  listLocataires,
  getById,
  updateLocataire,
  softDeleteLocataire,
};
