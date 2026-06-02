const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../../config/database");
const { notificationService } = require("../../services/notification.service");
const { logger } = require("../../utils/logger.util");

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getBcryptRounds = () => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10);
  return Number.isInteger(rounds) && rounds >= 8 ? rounds : 10;
};

const shouldExposeVerificationCode = () => {
  return process.env.AUTH_EXPOSE_VERIFICATION_CODE === "true";
};

const generateToken = (userId, role, tenantId) => {
  return jwt.sign(
    { userId, role, tenantId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const register = async (tenantId, data) => {
  const { nom, prenom, email, telephone, mot_de_passe, adresse } = data;

  const existing = await query(
    "SELECT id, deleted_at FROM users WHERE tenant_id = ? AND email = ?",
    [tenantId, email]
  );

  if (existing.length && !existing[0].deleted_at) {
    throw { status: 409, message: "Cette adresse email est déjà utilisée" };
  }

  const hashedPassword = await bcrypt.hash(mot_de_passe, getBcryptRounds());
  const code = generateVerificationCode();
  const expireAt = new Date(Date.now() + 30 * 60 * 1000);

  let userId;
  if (existing.length) {
    await query(
      `UPDATE users SET
       nom = ?, prenom = ?, telephone = ?, mot_de_passe = ?,
       role = 'CLIENT', statut = 'EN_ATTENTE_VERIFICATION',
       email_verifie = 0, code_verification_email = ?,
       code_verification_expire_at = ?, adresse = ?,
       deleted_at = NULL, bloque_jusqu_a = NULL,
       tentatives_connexion_echouees = 0
       WHERE id = ? AND tenant_id = ?`,
      [nom, prenom, telephone || null, hashedPassword, code, expireAt, adresse || null, existing[0].id, tenantId]
    );
    userId = existing[0].id;
  } else {
    const result = await query(
      `INSERT INTO users
       (tenant_id, nom, prenom, email, telephone, mot_de_passe, role,
        statut, email_verifie, code_verification_email,
        code_verification_expire_at, adresse)
       VALUES (?, ?, ?, ?, ?, ?, 'CLIENT',
               'EN_ATTENTE_VERIFICATION', 0, ?, ?, ?)`,
      [tenantId, nom, prenom, email, telephone || null, hashedPassword, code, expireAt, adresse || null]
    );
    userId = result.insertId;
  }

  const user = {
    id: userId,
    code_user: null,
    nom,
    prenom,
    email,
    role: "CLIENT",
  };

  notificationService.sendEmailVerification(tenantId, user, code).catch((error) => {
    logger.error("Erreur notification verification email en arriere-plan:", error.message);
  });

  if (shouldExposeVerificationCode()) {
    user.verification_code = code;
  }

  return user;
};

const verifyEmail = async (tenantId, email, code) => {
  const users = await query(
    `SELECT id, code_verification_email, code_verification_expire_at, statut, email_verifie, code_user, nom, prenom, role, telephone, photo_url, adresse, module_accessible
     FROM users
     WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL`,
    [tenantId, email]
  );

  if (!users.length) {
    throw { status: 404, message: "Utilisateur introuvable" };
  }

  const user = users[0];

  if (user.statut === "ACTIF" && user.email_verifie) {
    throw { status: 400, message: "Email déjà vérifié" };
  }

  if (user.code_verification_email !== code) {
    throw { status: 400, message: "Code de vérification incorrect" };
  }

  if (new Date() > new Date(user.code_verification_expire_at)) {
    throw { status: 400, message: "Code expiré. Veuillez en demander un nouveau" };
  }

  await query(
    `UPDATE users
     SET email_verifie = 1, statut = 'ACTIF',
         code_verification_email = NULL,
         code_verification_expire_at = NULL,
         derniere_connexion = NOW()
     WHERE id = ?`,
    [user.id]
  );

  await notificationService.sendWelcome(tenantId, user);

  const token = generateToken(user.id, user.role, tenantId);

  delete user.code_verification_email;
  delete user.code_verification_expire_at;

  return { user, token };
};

const verifyEmailCodeOnly = async (tenantId, email, code) => {
  const users = await query(
    `SELECT id, code_user, nom, prenom, email, role, telephone, photo_url, adresse,
            code_verification_email, code_verification_expire_at, statut, email_verifie
     FROM users
     WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL`,
    [tenantId, email]
  );

  if (!users.length) {
    throw { status: 404, message: "Utilisateur introuvable" };
  }

  const user = users[0];

  if (user.statut === "ACTIF" && user.email_verifie) {
    throw { status: 400, message: "Email deja verifie" };
  }

  if (user.code_verification_email !== code) {
    throw { status: 400, message: "Code de verification incorrect" };
  }

  if (new Date() > new Date(user.code_verification_expire_at)) {
    throw { status: 400, message: "Code expire. Veuillez en demander un nouveau" };
  }

  delete user.code_verification_email;
  delete user.code_verification_expire_at;

  return user;
};


const login = async (tenantId, email, mot_de_passe) => {
  const users = await query(
    `SELECT u.*,
            (SELECT valeur FROM parametres_systeme
             WHERE tenant_id = u.tenant_id AND cle = 'MAX_TENTATIVES_CONNEXION') AS max_tentatives,
            (SELECT valeur FROM parametres_systeme
             WHERE tenant_id = u.tenant_id AND cle = 'DUREE_BLOCAGE_MINUTES') AS duree_blocage
     FROM users u
     WHERE u.tenant_id = ? AND u.email = ? AND u.deleted_at IS NULL`,
    [tenantId, email]
  );

  if (!users.length) {
    throw { status: 401, message: "Email ou mot de passe incorrect" };
  }

  const user = users[0];
  const maxTentatives = parseInt(user.max_tentatives) || 5;
  const dureeBlocage = parseInt(user.duree_blocage) || 30;

  if (user.bloque_jusqu_a && new Date() < new Date(user.bloque_jusqu_a)) {
    const minutesRestantes = Math.ceil(
      (new Date(user.bloque_jusqu_a) - new Date()) / 60000
    );
    throw {
      status: 403,
      message: `Compte bloqué. Réessayez dans ${minutesRestantes} minute(s)`,
    };
  }

  if (user.statut === "SUPPRIME") {
    throw { status: 401, message: "Compte supprimé" };
  }
  if (user.statut === "INACTIF") {
    throw { status: 403, message: "Compte inactif" };
  }
  if (user.statut === "EN_ATTENTE_VERIFICATION") {
    throw { status: 403, message: "Veuillez vérifier votre email avant de vous connecter" };
  }

  const passwordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
  
  // LOG TEMPORAIRE POUR DEBUG (À SUPPRIMER APRÈS)

  if (!passwordValid) {
    const newTentatives = (user.tentatives_connexion_echouees || 0) + 1;
    const blocage =
      newTentatives >= maxTentatives
        ? new Date(Date.now() + dureeBlocage * 60 * 1000)
        : null;

    await query(
      `UPDATE users SET
       tentatives_connexion_echouees = ?,
       bloque_jusqu_a = ?,
       statut = IF(? >= ?, 'BLOQUE', statut)
       WHERE id = ?`,
      [newTentatives, blocage, newTentatives, maxTentatives, user.id]
    );

    throw { status: 401, message: "Email ou mot de passe incorrect" };
  }

  await query(
    `UPDATE users SET
     tentatives_connexion_echouees = 0,
     bloque_jusqu_a = NULL,
     derniere_connexion = NOW(),
     statut = IF(statut = 'BLOQUE', 'ACTIF', statut)
     WHERE id = ?`,
    [user.id]
  );

  const token = generateToken(user.id, user.role, user.tenant_id);

  delete user.mot_de_passe;
  delete user.code_verification_email;
  delete user.max_tentatives;
  delete user.duree_blocage;

  return { user, token };
};

const resendVerificationCode = async (tenantId, email) => {
  const users = await query(
    `SELECT id, nom, prenom, email, email_verifie, statut
     FROM users WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL`,
    [tenantId, email]
  );

  if (!users.length) {
    throw { status: 404, message: "Utilisateur introuvable" };
  }

  const user = users[0];

  if (user.email_verifie) {
    throw { status: 400, message: "Email déjà vérifié" };
  }

  const code = generateVerificationCode();
  const expireAt = new Date(Date.now() + 30 * 60 * 1000);

  await query(
    `UPDATE users SET code_verification_email = ?,
     code_verification_expire_at = ? WHERE id = ?`,
    [code, expireAt, user.id]
  );

  notificationService.sendEmailVerification(tenantId, user, code).catch((error) => {
    logger.error("Erreur renvoi verification email en arriere-plan:", error.message);
  });

  return shouldExposeVerificationCode() ? { verification_code: code } : true;
};

const changePassword = async (userId, ancienMdp, nouveauMdp) => {
  const users = await query(
    "SELECT id, mot_de_passe FROM users WHERE id = ?",
    [userId]
  );

  const user = users[0];
  const valid = await bcrypt.compare(ancienMdp, user.mot_de_passe);

  if (!valid) {
    throw { status: 400, message: "Ancien mot de passe incorrect" };
  }

  const hashed = await bcrypt.hash(nouveauMdp, getBcryptRounds());
  await query("UPDATE users SET mot_de_passe = ? WHERE id = ?", [hashed, userId]);

  return true;
};

const forgotPassword = async (tenantId, email) => {
  const users = await query(
    "SELECT id, nom, prenom, email FROM users WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL",
    [tenantId, email]
  );

  if (!users.length) {
    // Pour la sécurité, on ne dit pas si l'email existe ou pas
    return true;
  }

  const user = users[0];
  const code = generateVerificationCode();
  const expireAt = new Date(Date.now() + 30 * 60 * 1000);

  await query(
    `UPDATE users SET
     code_verification_email = ?,
     code_verification_expire_at = ?
     WHERE id = ?`,
    [code, expireAt, user.id]
  );

  await notificationService.sendPasswordResetEmail(tenantId, user, code);

  await notificationService.createNotification(tenantId, user.id, {
    titre: "Réinitialisation de mot de passe",
    message: `Votre code de réinitialisation est : ${code}`,
    module: "SYSTEME",
    type: "ALERTE_SYSTEME",
    canal: "APP"
  });

  return true;
};

const resetPassword = async (tenantId, email, code, nouveauMdp) => {
  const users = await query(
    `SELECT id, code_verification_email, code_verification_expire_at
     FROM users WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL`,
    [tenantId, email]
  );

  if (!users.length) {
    throw { status: 404, message: "Utilisateur introuvable" };
  }

  const user = users[0];

  if (user.code_verification_email !== code) {
    throw { status: 400, message: "Code de vérification incorrect" };
  }

  if (new Date() > new Date(user.code_verification_expire_at)) {
    throw { status: 400, message: "Code expiré" };
  }

  const hashed = await bcrypt.hash(nouveauMdp, getBcryptRounds());
  await query(
    `UPDATE users SET
     mot_de_passe = ?,
     code_verification_email = NULL,
     code_verification_expire_at = NULL,
     email_verifie = 1,
     statut = 'ACTIF'
     WHERE id = ?`,
    [hashed, user.id]
  );

  return true;
};

module.exports = {
  register,
  verifyEmail,
  verifyEmailCodeOnly,
  login,
  resendVerificationCode,
  changePassword,
  forgotPassword,
  resetPassword
};
