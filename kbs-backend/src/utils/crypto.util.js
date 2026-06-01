// Cryptography utility
const crypto = require('crypto');

module.exports = {
  hash: (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },
  encrypt: (data, key) => {
    // Encryption logic
    return crypto.createCipher('aes-256-cbc', key).update(data, 'utf8', 'hex');
  },
  decrypt: (encrypted, key) => {
    // Decryption logic
    return crypto.createDecipher('aes-256-cbc', key).update(encrypted, 'hex', 'utf8');
  },
};
