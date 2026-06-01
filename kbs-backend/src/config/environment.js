// Environment configuration
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
};
