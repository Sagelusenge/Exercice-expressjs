const Joi = require("joi");

const registerSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  prenom: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  telephone: Joi.string().max(50).optional().allow(null, ""),
  mot_de_passe: Joi.string().min(8).required(),
  adresse: Joi.string().optional().allow(null, ""),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().required(),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const resendCodeSchema = Joi.object({
  email: Joi.string().email().required(),
});

const changePasswordSchema = Joi.object({
  ancien_mot_de_passe: Joi.string().required(),
  nouveau_mot_de_passe: Joi.string().min(8).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  changePasswordSchema,
};