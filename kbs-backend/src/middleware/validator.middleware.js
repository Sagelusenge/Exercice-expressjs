const Joi = require("joi");
const { badRequest } = require("../utils/response.util");

/**
 * Middleware de validation des requêtes (Joi).
 * @param {Joi.Schema} schema
 * @param {string} target
 */
const validate = (schema, target = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      return badRequest(res, "Données invalides", errors);
    }

    req[target] = value;
    return next();
  };
};

module.exports = { validate };
