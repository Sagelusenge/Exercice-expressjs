const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { query } = require("../../config/database");
const R = require("../../utils/response.util");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { logActivity } = require("../../middleware/activityLog.middleware");
const { paginate, buildPagination } = require("../../utils/pagination.util");
const { notificationService } = require("../../services/notification.service");
const sequenceService = require("../../services/sequence.service");

const ADMIN_ROLES = ["SUPER_ADMIN", "BOSS", "GERANT"];
const SELF_SERVICE_ROLES = ["CLIENT", "LOCATAIRE"];
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Lister les utilisateurs
router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  async (req, res) => {
    const { role, statut, search, page = 1, limit = 20 } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    let where = "WHERE u.tenant_id = ? AND u.deleted_at IS NULL";
    const params = [req.tenantId];

    if (role)   { where += " AND u.role = ?";   params.push(role); }
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

    return R.paginated(res, users, buildPagination(total, page, l));
  }
);

// Créer un utilisateur
router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  logActivity("USERS", "USER_CREE"),
  async (req, res) => {
    const { nom, prenom, email, telephone, role, mot_de_passe, adresse } = req.body;

    const existing = await query(
      "SELECT id, deleted_at FROM users WHERE tenant_id = ? AND email = ?",
      [req.tenantId, email]
    );
    if (existing.length && !existing[0].deleted_at) {
      return R.badRequest(res, "Email déjà utilisé dans cette organisation");
    }

    const requiresVerification = SELF_SERVICE_ROLES.includes(role);
    const verificationCode = requiresVerification ? generateVerificationCode() : null;
    const verificationExpireAt = requiresVerification ? new Date(Date.now() + 30 * 60 * 1000) : null;
    const hashedPassword = await bcrypt.hash(mot_de_passe || "KbsTemp@2024", 12);
    let userId;

    if (existing.length) {
      const codeUser = await sequenceService.codeUser({ tenantId: req.tenantId, nom, prenom, role });
      await query(
        `UPDATE users SET
         code_user = COALESCE(code_user, ?),
         module_accessible = ?,
         nom = ?, prenom = ?, telephone = ?, mot_de_passe = ?,
         role = ?, statut = ?, email_verifie = ?,
         code_verification_email = ?,
         code_verification_expire_at = ?,
         adresse = ?, cree_par = ?, deleted_at = NULL,
         bloque_jusqu_a = NULL, tentatives_connexion_echouees = 0
         WHERE id = ? AND tenant_id = ?`,
        [
          codeUser,
          ["SUPER_ADMIN", "BOSS", "GERANT"].includes(role) ? "LES_DEUX" : role === "LOCATAIRE" ? "KBS" : "PARCELLES",
          nom,
          prenom,
          telephone || null,
          hashedPassword,
          role,
          requiresVerification ? "EN_ATTENTE_VERIFICATION" : "ACTIF",
          requiresVerification ? 0 : 1,
          verificationCode,
          verificationExpireAt,
          adresse || null,
          req.user.id,
          existing[0].id,
          req.tenantId,
        ]
      );
      userId = existing[0].id;
    } else {
      const codeUser = await sequenceService.codeUser({ tenantId: req.tenantId, nom, prenom, role });
      const result = await query(
      `INSERT INTO users
       (tenant_id, code_user, module_accessible, nom, prenom, email, telephone, mot_de_passe,
        role, statut, email_verifie, code_verification_email,
        code_verification_expire_at, adresse, cree_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        codeUser,
        ["SUPER_ADMIN", "BOSS", "GERANT"].includes(role) ? "LES_DEUX" : role === "LOCATAIRE" ? "KBS" : "PARCELLES",
        nom,
        prenom,
        email,
        telephone || null,
        hashedPassword,
        role,
        requiresVerification ? "EN_ATTENTE_VERIFICATION" : "ACTIF",
        requiresVerification ? 0 : 1,
        verificationCode,
        verificationExpireAt,
        adresse || null,
        req.user.id,
      ]
      );
      userId = result.insertId;
    }

    const [user] = await query(
      "SELECT id, code_user, nom, prenom, email, role, module_accessible FROM users WHERE id = ?",
      [userId]
    );

    if (requiresVerification) {
      await notificationService.sendEmailVerification(req.tenantId, user, verificationCode);
    }

    return R.created(res, user, "Utilisateur créé avec succès");
  }
);

// Détail utilisateur
router.get("/:id", authenticate, async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role) && parseInt(req.params.id) !== req.user.id) {
    return R.forbidden(res, "Accès interdit");
  }

  const users = await query(
    `SELECT u.id, u.code_user, u.tenant_id, u.nom, u.prenom, u.email,
            u.telephone, u.role, u.module_accessible, u.statut,
            u.photo_url, u.adresse, u.email_verifie, u.derniere_connexion,
            u.tentatives_connexion_echouees, u.bloque_jusqu_a, u.created_at,
            CONCAT(c.nom,' ',c.prenom) AS cree_par_nom
     FROM users u
     LEFT JOIN users c ON c.id = u.cree_par
     WHERE u.tenant_id = ? AND u.id = ? AND u.deleted_at IS NULL`,
    [req.tenantId, req.params.id]
  );

  if (!users.length) return R.notFound(res, "Utilisateur introuvable");
  return R.success(res, users[0]);
});

// Mettre à jour
router.put("/:id", authenticate, async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role) && parseInt(req.params.id) !== req.user.id) {
    return R.forbidden(res, "Accès interdit");
  }

  const { nom, prenom, telephone, adresse, photo_url } = req.body;
  await query(
    `UPDATE users SET
     nom       = COALESCE(?, nom),
     prenom    = COALESCE(?, prenom),
     telephone = COALESCE(?, telephone),
     adresse   = COALESCE(?, adresse),
     photo_url = COALESCE(?, photo_url)
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [nom, prenom, telephone, adresse, photo_url, req.params.id, req.tenantId]
  );

  const [user] = await query("SELECT * FROM users WHERE id = ?", [req.params.id]);
  return R.success(res, user, "Profil mis à jour");
});

// Changer le statut
router.patch(
  "/:id/status",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS", "GERANT"),
  logActivity("USERS", "USER_STATUT_CHANGE"),
  async (req, res) => {
    const { action } = req.body;
    const statutMap = {
      BLOQUER:    "BLOQUE",
      DEBLOQUER:  "ACTIF",
      ACTIVER:    "ACTIF",
      DESACTIVER: "INACTIF",
    };
    if (!statutMap[action]) return R.badRequest(res, "Action invalide");

    await query(
      "UPDATE users SET statut = ?, bloque_jusqu_a = NULL WHERE id = ? AND tenant_id = ?",
      [statutMap[action], req.params.id, req.tenantId]
    );

    const [user] = await query("SELECT * FROM users WHERE id = ?", [req.params.id]);
    return R.success(res, user, `Utilisateur ${action} avec succès`);
  }
);

// Supprimer (hard delete)
router.delete(
  "/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "BOSS"),
  logActivity("USERS", "USER_SUPPRIME"),
  async (req, res) => {
    // Vérifier si l'utilisateur existe
    const existing = await query(
      "SELECT id FROM users WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    if (!existing.length) {
      return R.notFound(res, "Utilisateur introuvable");
    }

    await query(
      "DELETE FROM users WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.tenantId]
    );
    return R.success(res, null, "Utilisateur supprimé");
  }
);


module.exports = router;
