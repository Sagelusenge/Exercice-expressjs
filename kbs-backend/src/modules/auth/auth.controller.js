const authService = require("./auth.service");
const R = require("../../utils/response.util");
const { query } = require("../../config/database");

const register = async (req, res) => {
  const user = await authService.register(req.tenantId, req.body);
  return R.created(
    res,
    { code_user: user.code_user, email: user.email },
    "Compte créé. Veuillez vérifier votre email pour activer votre compte."
  );
};

const verifyEmail = async (req, res) => {
  const { user, token } = await authService.verifyEmail(req.tenantId, req.body.email, req.body.code);
  return R.success(
    res,
    { user, token },
    "Email vérifié avec succès. Vous êtes maintenant connecté."
  );
};

const verifyCode = async (req, res) => {
  const user = await authService.verifyEmailCodeOnly(req.tenantId, req.body.email, req.body.code);
  return R.success(res, { user }, "Code verifie avec succes");
};


const login = async (req, res) => {
  const { user, token } = await authService.login(
    req.tenantId,
    req.body.email,
    req.body.mot_de_passe
  );
  return R.success(res, { user, token }, "Connexion réussie");
};

const resendCode = async (req, res) => {
  await authService.resendVerificationCode(req.tenantId, req.body.email);
  return R.success(res, null, "Nouveau code envoyé à votre adresse email");
};

const getMe = async (req, res) => {
  const users = await query(
    `SELECT id, code_user, tenant_id, nom, prenom, email, telephone,
            role, module_accessible, statut, photo_url, adresse,
            email_verifie, derniere_connexion, created_at
     FROM users WHERE id = ? AND deleted_at IS NULL`,
    [req.user.id]
  );
  return R.success(res, users[0]);
};

const changePassword = async (req, res) => {
  await authService.changePassword(
    req.user.id,
    req.body.ancien_mot_de_passe,
    req.body.nouveau_mot_de_passe
  );
  return R.success(res, null, "Mot de passe modifié avec succès");
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.tenantId, req.body.email);
  return R.success(res, null, "Code de réinitialisation envoyé par email");
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(
    req.tenantId,
    req.body.email,
    req.body.code,
    req.body.nouveau_mot_de_passe
  );
  return R.success(res, null, "Mot de passe réinitialisé avec succès");
};

module.exports = { 
  register, 
  verifyEmail, 
  verifyCode,
  login, 
  resendCode, 
  getMe, 
  changePassword,
  forgotPassword,
  resetPassword
};
