const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../../config/database");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");
const sequenceService = require("../../services/sequence.service");

/**
 * Créer un utilisateur (par un admin)
 * Rôles créables : BOSS, GERANT, CLIENT, LOCATAIRE
 * Le trigger trg_user_check_locataire exige cree_par non NULL pour LOCATAIRE
 * Le trigger trg_user_before_insert génère code_user et module_accessible
 */
const createUser = async (tenantId, creatorId, data) => {
  const { nom, prenom, email, telephone, role, mot_de_passe, adresse } = data;

  const existing = await query(
    "SELECT id FROM users WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL",
    [tenantId, email]
  );

  if (existing.length) {
    throw { status: 409, message: "Email déjà utilisé dans cette organisation" };
  }

  const hashedPassword = await bcrypt.hash(mot_de_passe || "KbsTemp@2024", 12);
  const codeUser = await sequenceService.codeUser({ tenantId, nom, prenom, role });
  const moduleAccessible = ["SUPER_ADMIN", "BOSS", "GERANT"].includes(role)
    ? "LES_DEUX"
    : role === "LOCATAIRE"
      ? "KBS"
      : "PARCELLES";

  const result = await query(
    `INSERT INTO users
     (tenant_id, code_user, module_accessible, nom, prenom, email, telephone, mot_de_passe,
      role, statut, email_verifie, adresse, cree_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIF', 1, ?, ?)`,
    [tenantId, codeUser, moduleAccessible, nom, prenom, email, telephone, hashedPassword, role, adresse, creatorId]
  );

  const [user] = await query(
    "SELECT id, code_user, nom, prenom, email, role, module_accessible FROM users WHERE id = ?",
    [result.insertId]
  );

  return user;
};

/**
 * Lister les utilisateurs avec pagination et filtres
 */
const listUsers = async (tenantId, filters = {}, page = 1, limit = 20) => {
  const { role, statut, search } = filters;
  const { offset, limit: l } = paginate(page, limit);

  let where = "WHERE u.tenant_id = ? AND u.deleted_at IS NULL";
  const params = [tenantId];

  if (role) { where += " AND u.role = ?"; params.push(role); }
  if (statut) { where += " AND u.statut = ?"; params.push(statut); }
  if (search) {
    where += " AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ? OR u.code_user LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM users u ${where}`, params
  );

  const users = await query(
    `SELECT u.id, u.code_user, u.nom, u.prenom, u.email, u.telephone,
            u.role, u.module_accessible, u.statut, u.photo_url,
            u.email_verifie, u.derniere_connexion, u.created_at,
            CONCAT(c.nom,' ',c.prenom) AS cree_par_nom
     FROM users u
     LEFT JOIN users c ON c.id = u.cree_par
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, l, offset]
  );

  return { users, pagination: buildPagination(total, page, l) };
};

/**
 * Obtenir un utilisateur par ID
 */
const getUserById = async (tenantId, userId) => {
  const users = await query(
    `SELECT u.id, u.code_user, u.tenant_id, u.nom, u.prenom, u.email,
            u.telephone, u.role, u.module_accessible, u.statut,
            u.photo_url, u.adresse, u.email_verifie, u.derniere_connexion,
            u.tentatives_connexion_echouees, u.bloque_jusqu_a, u.created_at,
            CONCAT(c.nom,' ',c.prenom) AS cree_par_nom
     FROM users u
     LEFT JOIN users c ON c.id = u.cree_par
     WHERE u.tenant_id = ? AND u.id = ? AND u.deleted_at IS NULL`,
    [tenantId, userId]
  );

  if (!users.length) throw { status: 404, message: "Utilisateur introuvable" };
  return users[0];
};

/**
 * Mettre à jour un utilisateur
 */
const updateUser = async (tenantId, userId, data) => {
  const { nom, prenom, telephone, adresse, photo_url } = data;

  await query(
    `UPDATE users SET nom = COALESCE(?, nom), prenom = COALESCE(?, prenom),
     telephone = COALESCE(?, telephone), adresse = COALESCE(?, adresse),
     photo_url = COALESCE(?, photo_url)
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [nom, prenom, telephone, adresse, photo_url, userId, tenantId]
  );

  return getUserById(tenantId, userId);
};

/**
 * Bloquer / Débloquer un utilisateur
 * Alimente : statut, bloque_jusqu_a
 */
const toggleUserStatus = async (tenantId, userId, action, adminId) => {
  const actions = {
    BLOQUER: { statut: "BLOQUE" },
    DEBLOQUER: { statut: "ACTIF" },
    ACTIVER: { statut: "ACTIF" },
    DESACTIVER: { statut: "INACTIF" },
  };

  if (!actions[action]) throw { status: 400, message: "Action invalide" };

  await query(
    "UPDATE users SET statut = ?, bloque_jusqu_a = NULL WHERE id = ? AND tenant_id = ?",
    [actions[action].statut, userId, tenantId]
  );

  return getUserById(tenantId, userId);
};

/**
 * Suppression physique (hard delete — suppression définitive)
 */
const softDeleteUser = async (tenantId, userId) => {
  await query(
    "DELETE FROM users WHERE id = ? AND tenant_id = ?",
    [userId, tenantId]
  );
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  softDeleteUser,
};
