const Certificate = require('../models/Certificate');
const ScanLog = require('../models/ScanLog');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const createHashSignature = require('../utils/hashSignature');
const getClientMeta = require('../utils/getClientMeta');
const generateQrBuffer = require('../utils/generateQrBuffer');
const generateCertificatePdfBuffer = require('../utils/generatePdfBuffer');

const certificateIdPattern = /^[A-Za-z0-9-]{8,24}$/;

const isValidCertificateId = (certificateId) => certificateIdPattern.test(certificateId);

const normalizeSessionId = (sessionId) => {
  if (!sessionId) {
    return null;
  }

  const value = String(sessionId).trim();
  if (!/^[A-Za-z0-9_-]{6,48}$/.test(value)) {
    return null;
  }

  return value;
};

const getPdfTokenTtlInMinutes = () => {
  const parsedValue = Number(process.env.PDF_ACCESS_TOKEN_TTL_MINUTES || 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 1 || parsedValue > 60) {
    return 10;
  }

  return Math.floor(parsedValue);
};

const parseBooleanFlag = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const isAllowedAssetUrl = (assetUrl) => {
  if (!assetUrl) {
    return false;
  }

  try {
    const parsed = new URL(assetUrl);
    const protocolAllowed = parsed.protocol === 'https:' || parsed.protocol === 'http:';
    const hostAllowed = parsed.hostname.endsWith('cloudinary.com');
    return protocolAllowed && hostAllowed;
  } catch {
    return false;
  }
};

const fetchOptionalBuffer = async (assetUrl) => {
  if (!isAllowedAssetUrl(assetUrl)) {
    return null;
  }

  try {
    const response = await fetch(assetUrl);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

const createVerificationUrl = (certificateId) => {
  const frontendBaseUrl = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (frontendBaseUrl) {
    return `${frontendBaseUrl}/verify/${certificateId}`;
  }

  return `http://localhost:5173/verify/${certificateId}`;
};

const generatePdfAccessToken = ({ certificateId, certificateVersion, sessionId }) => {
  const expiresInMinutes = getPdfTokenTtlInMinutes();

  const token = jwt.sign(
    {
      type: 'pdf-access',
      certificateId,
      v: certificateVersion,
      sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: `${expiresInMinutes}m` },
  );

  return {
    token,
    expiresInMinutes,
  };
};

const computeStatus = (certificate) => {
  if (certificate.status === 'revoked') {
    return 'revoked';
  }

  if (certificate.expiryDate && new Date(certificate.expiryDate).getTime() < Date.now()) {
    return 'expired';
  }

  return 'active';
};

const verifyCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  if (!isValidCertificateId(certificateId)) {
    res.status(400);
    throw new Error('Invalid certificate identifier format.');
  }

  const certificate = await Certificate.findOne({ certificateId }).lean();

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found.');
  }

  const recomputedHash = createHashSignature({
    candidateName: certificate.candidateName,
    certificateId: certificate.certificateId,
    issueDate: certificate.issueDate,
    issuerName: certificate.issuerName,
  });

  const isAuthentic = recomputedHash === certificate.hashSignature;
  const effectiveStatus = computeStatus(certificate);

  const clientMeta = getClientMeta(req);
  await ScanLog.create({
    certificateId: certificate.certificateId,
    ipAddress: clientMeta.ipAddress,
    browser: clientMeta.browser,
    device: clientMeta.device,
    country: clientMeta.country,
    city: clientMeta.city,
    scannedAt: new Date(),
  });

  // Scan metrics should not rotate updatedAt, because PDF token versioning relies on updatedAt.
  await Certificate.updateOne({ _id: certificate._id }, { $inc: { scanCount: 1 } }, { timestamps: false });

  const sessionId = normalizeSessionId(req.query.sessionId);
  const certificateVersion = Number(new Date(certificate.updatedAt).getTime()) || 0;
  const { token, expiresInMinutes } = generatePdfAccessToken({
    certificateId: certificate.certificateId,
    certificateVersion,
    sessionId,
  });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const pdfAccessUrl = `${baseUrl}/api/verify/${certificate.certificateId}/pdf?token=${encodeURIComponent(token)}${
    sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''
  }`;

  res.json({
    success: true,
    certificate: {
      certificateId: certificate.certificateId,
      candidateName: certificate.candidateName,
      certificateTitle: certificate.certificateTitle,
      courseName: certificate.courseName,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      issuerName: certificate.issuerName,
      organization: certificate.organization,
      status: certificate.status,
      effectiveStatus,
      grade: certificate.grade,
      description: certificate.description,
      pdfAccessUrl,
      qrUrl: certificate.qrUrl,
      hashSignature: certificate.hashSignature,
      recomputedHash,
      logoUrl: certificate.logoUrl,
      signatureUrl: certificate.signatureUrl,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    },
    verification: {
      isAuthentic,
      message: isAuthentic ? 'Verified Authentic Certificate ✅' : 'Tampered Certificate ❌',
      pdfTokenExpiresInMinutes: expiresInMinutes,
    },
  });
});

const streamProtectedPdf = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const { token } = req.query;
  const sessionId = normalizeSessionId(req.query.sessionId);
  const shouldDownload = parseBooleanFlag(req.query.download);

  if (!isValidCertificateId(certificateId)) {
    res.status(400);
    throw new Error('Invalid certificate identifier format.');
  }

  if (!token || typeof token !== 'string') {
    res.status(401);
    throw new Error('Missing PDF access token.');
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    const isExpired = error?.name === 'TokenExpiredError';
    throw new Error(isExpired ? 'PDF access token has expired. Please re-verify this certificate.' : 'Invalid PDF access token.');
  }

  if (decodedToken.type !== 'pdf-access' || decodedToken.certificateId !== certificateId) {
    res.status(401);
    throw new Error('PDF access token does not match this certificate.');
  }

  if (decodedToken.sessionId && decodedToken.sessionId !== sessionId) {
    res.status(401);
    throw new Error('PDF access token session validation failed.');
  }

  const certificate = await Certificate.findOne({ certificateId }).lean();

  if (!certificate?.pdfUrl) {
    res.status(404);
    throw new Error('Certificate PDF not found.');
  }

  const currentVersion = Number(new Date(certificate.updatedAt).getTime()) || 0;

  if (decodedToken.v !== currentVersion) {
    res.status(401);
    throw new Error('PDF access token is outdated. Please re-verify this certificate.');
  }

  let pdfBuffer = await fetchOptionalBuffer(certificate.pdfUrl);

  if (!pdfBuffer) {
    const verificationUrl = createVerificationUrl(certificate.certificateId);
    const [logoBuffer, signatureBuffer, qrBuffer] = await Promise.all([
      fetchOptionalBuffer(certificate.logoUrl),
      fetchOptionalBuffer(certificate.signatureUrl),
      generateQrBuffer(verificationUrl),
    ]);

    pdfBuffer = await generateCertificatePdfBuffer({
      certificate,
      logoBuffer,
      signatureBuffer,
      qrBuffer,
      verificationUrl,
    });
  }

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('X-Robots-Tag', 'noindex, nofollow');

  // Allow protected PDF rendering inside frontend iframe origin.
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');

  const fileName = `certificate_${certificate.certificateId}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `${shouldDownload ? 'attachment' : 'inline'}; filename="${fileName}"`);
  res.send(pdfBuffer);
});

module.exports = {
  verifyCertificate,
  streamProtectedPdf,
};
