const Certificate = require('../models/Certificate');
const ScanLog = require('../models/ScanLog');
const asyncHandler = require('../utils/asyncHandler');
const generateCertificateId = require('../utils/generateCertificateId');
const createHashSignature = require('../utils/hashSignature');
const generateQrBuffer = require('../utils/generateQrBuffer');
const uploadBufferToCloudinary = require('../utils/cloudinaryUpload');
const generateCertificatePdfBuffer = require('../utils/generatePdfBuffer');

const computeEffectiveStatus = (certificate) => {
  if (certificate.status === 'revoked') {
    return 'revoked';
  }

  if (certificate.expiryDate && new Date(certificate.expiryDate).getTime() < Date.now()) {
    return 'expired';
  }

  return 'active';
};

const transformCertificate = (certificate) => {
  const serialized = certificate.toObject ? certificate.toObject() : certificate;

  return {
    ...serialized,
    id: serialized._id,
    effectiveStatus: computeEffectiveStatus(serialized),
  };
};

const findUniqueCertificateId = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidateId = generateCertificateId();
    const exists = await Certificate.exists({ certificateId: candidateId });
    if (!exists) {
      return candidateId;
    }
  }

  throw new Error('Failed to generate a unique certificate ID after multiple attempts.');
};

const createCertificate = asyncHandler(async (req, res) => {
  const {
    candidateName,
    certificateTitle,
    courseName: courseNameFromBody,
    course,
    issueDate,
    expiryDate,
    issuerName: issuerNameFromBody,
    grade,
    description,
  } = req.body;

  const courseName = courseNameFromBody || course;
  const issuerName = issuerNameFromBody || req.user.name;

  if (!candidateName || !certificateTitle || !courseName || !issueDate || !issuerName) {
    res.status(400);
    throw new Error('candidateName, certificateTitle, courseName, issueDate, and issuerName are required.');
  }

  const parsedIssueDate = new Date(issueDate);
  const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

  if (Number.isNaN(parsedIssueDate.getTime())) {
    res.status(400);
    throw new Error('issueDate must be a valid date.');
  }

  if (parsedExpiryDate && Number.isNaN(parsedExpiryDate.getTime())) {
    res.status(400);
    throw new Error('expiryDate must be a valid date when provided.');
  }

  const certificateId = await findUniqueCertificateId();

  const hashSignature = createHashSignature({
    candidateName,
    certificateId,
    issueDate: parsedIssueDate,
    issuerName,
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${certificateId}`;
  const qrBuffer = await generateQrBuffer(verificationUrl);

  const qrUpload = await uploadBufferToCloudinary(qrBuffer, {
    folder: 'truecert/qr',
    resource_type: 'image',
    public_id: `qr_${certificateId}_${Date.now()}`,
    overwrite: true,
  });

  const logoFile = req.files?.logo?.[0] || null;
  const signatureFile = req.files?.signature?.[0] || null;

  let logoUpload = null;
  let signatureUpload = null;

  if (logoFile) {
    logoUpload = await uploadBufferToCloudinary(logoFile.buffer, {
      folder: 'truecert/logos',
      resource_type: 'image',
      public_id: `logo_${certificateId}_${Date.now()}`,
      overwrite: true,
    });
  }

  if (signatureFile) {
    signatureUpload = await uploadBufferToCloudinary(signatureFile.buffer, {
      folder: 'truecert/signatures',
      resource_type: 'image',
      public_id: `signature_${certificateId}_${Date.now()}`,
      overwrite: true,
    });
  }

  const certificatePayload = {
    certificateId,
    candidateName,
    certificateTitle,
    courseName,
    issueDate: parsedIssueDate,
    expiryDate: parsedExpiryDate,
    issuerName,
    status: 'active',
    grade: grade || '',
    description: description || '',
    organization: req.user.organization,
    logoUrl: logoUpload?.secure_url || '',
    signatureUrl: signatureUpload?.secure_url || '',
    qrUrl: qrUpload.secure_url,
    hashSignature,
  };

  const pdfBuffer = await generateCertificatePdfBuffer({
    certificate: {
      ...certificatePayload,
      createdAt: new Date(),
    },
    logoBuffer: logoFile?.buffer || null,
    signatureBuffer: signatureFile?.buffer || null,
    qrBuffer,
    verificationUrl,
  });

  const pdfUpload = await uploadBufferToCloudinary(pdfBuffer, {
    folder: 'truecert/pdfs',
    resource_type: 'raw',
    format: 'pdf',
    public_id: `certificate_${certificateId}_${Date.now()}`,
    overwrite: true,
  });

  const certificate = await Certificate.create({
    ...certificatePayload,
    pdfUrl: pdfUpload.secure_url,
    cloudinaryPublicId: pdfUpload.public_id,
    qrPublicId: qrUpload.public_id,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Certificate issued successfully.',
    certificate: transformCertificate(certificate),
  });
});

const getCertificates = asyncHandler(async (req, res) => {
  const searchQuery = req.query.search ? String(req.query.search).trim() : '';
  const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

  if (searchQuery) {
    filter.$or = [
      { certificateId: { $regex: searchQuery, $options: 'i' } },
      { candidateName: { $regex: searchQuery, $options: 'i' } },
      { certificateTitle: { $regex: searchQuery, $options: 'i' } },
    ];
  }

  const certificates = await Certificate.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    total: certificates.length,
    certificates: certificates.map(transformCertificate),
  });
});

const getCertificateById = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const certificate = await Certificate.findOne({ certificateId });
  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found.');
  }

  if (req.user.role !== 'admin' && String(certificate.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You do not have access to this certificate.');
  }

  res.json({
    success: true,
    certificate: transformCertificate(certificate),
  });
});

const revokeCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const certificate = await Certificate.findOne({ certificateId });

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found.');
  }

  if (req.user.role !== 'admin' && String(certificate.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You do not have permission to revoke this certificate.');
  }

  if (certificate.status === 'revoked') {
    res.status(400);
    throw new Error('Certificate is already revoked.');
  }

  certificate.status = 'revoked';
  await certificate.save();

  res.json({
    success: true,
    message: 'Certificate revoked successfully.',
    certificate: transformCertificate(certificate),
  });
});

const getDashboardSummary = asyncHandler(async (req, res) => {
  const baseFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

  const certificates = await Certificate.find(baseFilter).sort({ createdAt: -1 }).lean();
  const certificateIds = certificates.map((item) => item.certificateId);

  const now = Date.now();
  let activeCertificates = 0;
  let revokedCertificates = 0;
  let expiredCertificates = 0;

  certificates.forEach((item) => {
    if (item.status === 'revoked') {
      revokedCertificates += 1;
      return;
    }

    if (item.expiryDate && new Date(item.expiryDate).getTime() < now) {
      expiredCertificates += 1;
      return;
    }

    activeCertificates += 1;
  });

  const scanFilter = certificateIds.length > 0 ? { certificateId: { $in: certificateIds } } : { certificateId: null };

  const totalScans = await ScanLog.countDocuments(scanFilter);
  const lastIssuedCertificate = certificates[0] || null;

  const recentScans = await ScanLog.find(scanFilter).sort({ scannedAt: -1 }).limit(5).lean();
  const recentIssues = certificates.slice(0, 5).map((item) => ({
    type: 'issued',
    message: `${item.certificateTitle} issued for ${item.candidateName}`,
    timestamp: item.createdAt,
    certificateId: item.certificateId,
  }));
  const recentScanItems = recentScans.map((scan) => ({
    type: 'scan',
    message: `Certificate ${scan.certificateId} verified from ${scan.country}`,
    timestamp: scan.scannedAt,
    certificateId: scan.certificateId,
  }));

  const recentActivity = [...recentIssues, ...recentScanItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  res.json({
    success: true,
    summary: {
      totalCertificates: certificates.length,
      activeCertificates,
      revokedCertificates,
      expiredCertificates,
      totalScans,
      lastIssuedCertificate,
      recentActivity,
    },
  });
});

module.exports = {
  createCertificate,
  getCertificates,
  getCertificateById,
  revokeCertificate,
  getDashboardSummary,
};
