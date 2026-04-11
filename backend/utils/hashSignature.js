const crypto = require('node:crypto');

const createHashSignature = ({ candidateName, certificateId, issueDate, issuerName }) => {
  const normalizedIssueDate = new Date(issueDate).toISOString();
  const payload = `${candidateName}|${certificateId}|${normalizedIssueDate}|${issuerName}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

module.exports = createHashSignature;
