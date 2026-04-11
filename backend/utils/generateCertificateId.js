const crypto = require('node:crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomChars = (length) => {
  const bytes = crypto.randomBytes(length);
  let output = '';

  for (let i = 0; i < length; i += 1) {
    output += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return output;
};

const generateCertificateId = () => `TC${randomChars(11)}`;

module.exports = generateCertificateId;
