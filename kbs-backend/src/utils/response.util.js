const success = (res, data = null, message = "Succès", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const created = (res, data = null, message = "Ressource créée") => {
  return success(res, data, message, 201);
};

const error = (res, message = "Erreur serveur", statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

const notFound = (res, message = "Ressource introuvable") => {
  return error(res, message, 404);
};

const forbidden = (res, message = "Accès interdit") => {
  return error(res, message, 403);
};

const unauthorized = (res, message = "Non authentifié") => {
  return error(res, message, 401);
};

const badRequest = (res, message = "Requête invalide", errors = null) => {
  return error(res, message, 400, errors);
};

const paginated = (res, data, pagination, message = "Succès") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  success,
  created,
  error,
  notFound,
  forbidden,
  unauthorized,
  badRequest,
  paginated,
};