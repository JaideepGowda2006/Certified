const mongoose = require('mongoose');

const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');
const ScanLog = require('../models/ScanLog');
const asyncHandler = require('../utils/asyncHandler');
const generateCertificateId = require('../utils/generateCertificateId');
const createHashSignature = require('../utils/hashSignature');
const generateQrBuffer = require('../utils/generateQrBuffer');
const uploadBufferToCloudinary = require('../utils/cloudinaryUpload');
const generateCertificatePdfBuffer = require('../utils/generatePdfBuffer');

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 20000;
const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i;

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

const transformTemplateListItem = (template) => {
  const serialized = template.toObject ? template.toObject() : template;

  return {
    id: serialized._id,
    templateName: serialized.templateName,
    createdBy: serialized.createdBy,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };
};

const transformTemplateDetails = (template) => {
  const serialized = template.toObject ? template.toObject() : template;

  return {
    id: serialized._id,
    templateName: serialized.templateName,
    templateJson: serialized.templateJson,
    createdBy: serialized.createdBy,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };
};

const withTimeout = (promise, timeoutMs, timeoutMessage) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const uploadToCloudinarySafe = async (res, buffer, options, failureMessage) => {
  try {
    return await withTimeout(
      uploadBufferToCloudinary(buffer, options),
      CLOUDINARY_UPLOAD_TIMEOUT_MS,
      `${failureMessage} timed out.`,
    );
  } catch (error) {
    res.status(502);
    throw new Error(`${failureMessage} ${error.message}`.trim());
  }
};

const parseTemplateJson = (templateJsonRaw) => {
  if (templateJsonRaw === undefined || templateJsonRaw === null || templateJsonRaw === '') {
    return null;
  }

  if (typeof templateJsonRaw === 'object') {
    return templateJsonRaw;
  }

  if (typeof templateJsonRaw !== 'string') {
    return null;
  }

  return JSON.parse(templateJsonRaw);
};

const normalizeTemplateName = (name) => {
  const normalized = String(name || '').trim();
  if (!normalized) {
    return 'Untitled Template';
  }

  return normalized.slice(0, 120);
};

const hasDrawableObjects = (templateJson) =>
  Boolean(templateJson && Array.isArray(templateJson.objects) && templateJson.objects.length > 0);

const normalizeRequestedCertificateId = (requestedId) => {
  const normalized = String(requestedId || '')
    .trim()
    .replaceAll(/\s+/g, '-')
    .toUpperCase();

  if (!normalized) {
    return null;
  }

  if (!/^[A-Z0-9_-]{6,64}$/.test(normalized)) {
    throw new Error(
      'certificateId must be 6-64 chars and use only letters, numbers, underscores, or hyphens.',
    );
  }

  return normalized;
};

const findUniqueCertificateId = async (preferredId = null) => {
  if (preferredId) {
    const exists = await Certificate.exists({ certificateId: preferredId });
    if (exists) {
      throw new Error('A certificate with this certificateId already exists.');
    }

    return preferredId;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidateId = generateCertificateId();
    const exists = await Certificate.exists({ certificateId: candidateId });
    if (!exists) {
      return candidateId;
    }
  }

  throw new Error('Failed to generate a unique certificate ID after multiple attempts.');
};

const decodeImageDataUrl = (src) => {
  const match = String(src || '').match(DATA_URL_PATTERN);
  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  const payload = match[2] || '';

  return {
    mimeType,
    buffer: Buffer.from(payload, 'base64'),
  };
};

const traverseFabricObjects = async (objects, visitor) => {
  if (!Array.isArray(objects)) {
    return;
  }

  for (const object of objects) {
    // eslint-disable-next-line no-await-in-loop
    await visitor(object);

    if (Array.isArray(object?.objects) && object.objects.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await traverseFabricObjects(object.objects, visitor);
    }
  }
};

const uploadTemplateEmbeddedImages = async (res, templateJson, createdBy) => {
  const serializedTemplateJson = JSON.parse(JSON.stringify(templateJson));
  let uploadedCount = 0;

  await traverseFabricObjects(serializedTemplateJson.objects, async (object) => {
    if (object?.type !== 'image' || typeof object.src !== 'string') {
      return;
    }

    const decoded = decodeImageDataUrl(object.src);
    if (!decoded) {
      return;
    }

    const extension = decoded.mimeType.includes('png')
      ? 'png'
      : decoded.mimeType.includes('webp')
        ? 'webp'
        : 'jpg';

    const upload = await uploadToCloudinarySafe(
      res,
      decoded.buffer,
      {
        folder: 'truecert/template-assets',
        resource_type: 'image',
        format: extension,
        public_id: `template_asset_${createdBy}_${Date.now()}_${uploadedCount + 1}`,
        overwrite: true,
      },
      'Cloudinary asset upload failed.',
    );

    object.src = upload.secure_url;
    object.crossOrigin = 'anonymous';
    uploadedCount += 1;
  });

  return {
    normalizedTemplateJson: serializedTemplateJson,
    uploadedCount,
  };
};

const ensureTemplateAccess = (req, template) => {
  if (!template) {
    return false;
  }

  if (req.user.role === 'admin') {
    return true;
  }

  return String(template.createdBy) === String(req.user._id);
};

const getVerificationUrl = (certificateId) => {
  const baseUrl = String(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  return `${baseUrl}/verify/${certificateId}`;
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
    templateId,
    templateName: templateNameFromBody,
    templateJson: templateJsonRaw,
    certificateId: requestedCertificateIdRaw,
  } = req.body;

  const courseName = courseNameFromBody || course;
  const issuerName = issuerNameFromBody || req.user.name;
  const normalizedCertificateTitle = String(certificateTitle || 'Certificate of Completion').trim();

  if (!candidateName || !courseName || !issueDate || !issuerName || !normalizedCertificateTitle) {
    res.status(400);
    throw new Error(
      'candidateName, certificateTitle, courseName, issueDate, and issuerName are required.',
    );
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

  let parsedTemplateJson = null;
  if (templateJsonRaw !== undefined && templateJsonRaw !== null && templateJsonRaw !== '') {
    try {
      parsedTemplateJson = parseTemplateJson(templateJsonRaw);
    } catch {
      res.status(400);
      throw new Error('templateJson must be valid JSON.');
    }

    if (!parsedTemplateJson || typeof parsedTemplateJson !== 'object') {
      res.status(400);
      throw new Error('templateJson must be a valid JSON object.');
    }
  }

  let requestedCertificateId = null;
  try {
    requestedCertificateId = normalizeRequestedCertificateId(requestedCertificateIdRaw);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  let linkedTemplate = null;
  if (templateId) {
    if (!mongoose.Types.ObjectId.isValid(String(templateId))) {
      res.status(400);
      throw new Error('templateId is not valid.');
    }

    linkedTemplate = await CertificateTemplate.findById(templateId);

    if (!linkedTemplate) {
      res.status(404);
      throw new Error('Template not found.');
    }

    if (!ensureTemplateAccess(req, linkedTemplate)) {
      res.status(403);
      throw new Error('You do not have access to this template.');
    }
  }

  const certificateId = await findUniqueCertificateId(requestedCertificateId);

  const hashSignature = createHashSignature({
    candidateName,
    certificateId,
    issueDate: parsedIssueDate,
    issuerName,
  });

  const verificationUrl = getVerificationUrl(certificateId);
  const qrBuffer = await generateQrBuffer(verificationUrl);

  const qrUpload = await uploadToCloudinarySafe(
    res,
    qrBuffer,
    {
      folder: 'truecert/qr',
      resource_type: 'image',
      public_id: `qr_${certificateId}_${Date.now()}`,
      overwrite: true,
    },
    'QR upload failed.',
  );

  const logoFile = req.files?.logo?.[0] || null;
  const signatureFile = req.files?.signature?.[0] || null;
  const sealFile = req.files?.seal?.[0] || null;
  const watermarkFile = req.files?.watermark?.[0] || null;
  const backgroundImageFile = req.files?.backgroundImage?.[0] || null;
  const generatedImageFile = req.files?.generatedImage?.[0] || req.files?.certificateImage?.[0] || null;

  const logoUpload = logoFile
    ? await uploadToCloudinarySafe(
        res,
        logoFile.buffer,
        {
          folder: 'truecert/logos',
          resource_type: 'image',
          public_id: `logo_${certificateId}_${Date.now()}`,
          overwrite: true,
        },
        'Logo upload failed.',
      )
    : null;

  const signatureUpload = signatureFile
    ? await uploadToCloudinarySafe(
        res,
        signatureFile.buffer,
        {
          folder: 'truecert/signatures',
          resource_type: 'image',
          public_id: `signature_${certificateId}_${Date.now()}`,
          overwrite: true,
        },
        'Signature upload failed.',
      )
    : null;

  const sealUpload = sealFile
    ? await uploadToCloudinarySafe(
        res,
        sealFile.buffer,
        {
          folder: 'truecert/assets',
          resource_type: 'image',
          public_id: `seal_${certificateId}_${Date.now()}`,
          overwrite: true,
        },
        'Seal upload failed.',
      )
    : null;

  const watermarkUpload = watermarkFile
    ? await uploadToCloudinarySafe(
        res,
        watermarkFile.buffer,
        {
          folder: 'truecert/assets',
          resource_type: 'image',
          public_id: `watermark_${certificateId}_${Date.now()}`,
          overwrite: true,
        },
        'Watermark upload failed.',
      )
    : null;

  const backgroundUpload = backgroundImageFile
    ? await uploadToCloudinarySafe(
        res,
        backgroundImageFile.buffer,
        {
          folder: 'truecert/assets',
          resource_type: 'image',
          public_id: `background_${certificateId}_${Date.now()}`,
          overwrite: true,
        },
        'Background image upload failed.',
      )
    : null;

  const previewUpload = generatedImageFile
    ? await uploadToCloudinarySafe(
        res,
        generatedImageFile.buffer,
        {
          folder: 'truecert/previews',
          resource_type: 'image',
          public_id: `preview_${certificateId}_${Date.now()}`,
          overwrite: true,
        },
        'Generated preview upload failed.',
      )
    : null;

  const certificatePayload = {
    certificateId,
    candidateName,
    certificateTitle: normalizedCertificateTitle,
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
    templateRef: linkedTemplate?._id || null,
    templateName: String(templateNameFromBody || linkedTemplate?.templateName || '').trim(),
    renderSource: generatedImageFile ? 'canvas' : 'premium',
    previewImageUrl: previewUpload?.secure_url || '',
    assetUrls: {
      seal: sealUpload?.secure_url || '',
      watermark: watermarkUpload?.secure_url || '',
      backgroundImage: backgroundUpload?.secure_url || '',
    },
  };

  const pdfBuffer = await generateCertificatePdfBuffer({
    certificate: {
      ...certificatePayload,
      createdAt: new Date(),
    },
    logoBuffer: logoFile?.buffer || null,
    signatureBuffer: signatureFile?.buffer || null,
    qrBuffer,
    canvasImageBuffer: generatedImageFile?.buffer || null,
    canvasImageMimeType: generatedImageFile?.mimetype || '',
    verificationUrl,
  });

  const pdfUpload = await uploadToCloudinarySafe(
    res,
    pdfBuffer,
    {
      folder: 'truecert/pdfs',
      resource_type: 'raw',
      format: 'pdf',
      public_id: `certificate_${certificateId}_${Date.now()}`,
      overwrite: true,
    },
    'PDF upload failed.',
  );

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
    templateReceived: hasDrawableObjects(parsedTemplateJson),
  });
});

const saveCertificateTemplate = asyncHandler(async (req, res) => {
  const { templateName, templateJson: templateJsonRaw } = req.body;

  if (templateJsonRaw === undefined || templateJsonRaw === null || templateJsonRaw === '') {
    res.status(400);
    throw new Error('templateJson is required.');
  }

  let parsedTemplateJson;
  try {
    parsedTemplateJson = parseTemplateJson(templateJsonRaw);
  } catch {
    res.status(400);
    throw new Error('templateJson must be valid JSON.');
  }

  if (!parsedTemplateJson || typeof parsedTemplateJson !== 'object') {
    res.status(400);
    throw new Error('templateJson must be a valid JSON object.');
  }

  if (!hasDrawableObjects(parsedTemplateJson)) {
    res.status(400);
    throw new Error('Cannot save an empty template. Add at least one object to the canvas.');
  }

  const { normalizedTemplateJson, uploadedCount } = await uploadTemplateEmbeddedImages(
    res,
    parsedTemplateJson,
    req.user._id,
  );

  const template = await CertificateTemplate.create({
    templateName: normalizeTemplateName(templateName),
    templateJson: normalizedTemplateJson,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Template saved successfully.',
    uploadedAssets: uploadedCount,
    template: transformTemplateDetails(template),
  });
});

const getCertificateTemplates = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

  const templates = await CertificateTemplate.find(filter)
    .select('_id templateName createdBy createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    total: templates.length,
    templates: templates.map(transformTemplateListItem),
  });
});

const getCertificateTemplateById = asyncHandler(async (req, res) => {
  const { templateId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(String(templateId))) {
    res.status(400);
    throw new Error('templateId is not valid.');
  }

  const template = await CertificateTemplate.findById(templateId);

  if (!template) {
    res.status(404);
    throw new Error('Template not found.');
  }

  if (!ensureTemplateAccess(req, template)) {
    res.status(403);
    throw new Error('You do not have access to this template.');
  }

  res.json({
    success: true,
    template: transformTemplateDetails(template),
  });
});

const getQrPlaceholderImage = asyncHandler(async (req, res) => {
  const requestedValue = String(req.query.value || '').trim();
  const requestedCertificateId = String(req.query.certificateId || '')
    .trim()
    .replaceAll(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 64);

  const fallbackCertificateId = requestedCertificateId || 'PREVIEW-0001';
  const qrValue = requestedValue || getVerificationUrl(fallbackCertificateId);

  const qrBuffer = await generateQrBuffer(qrValue);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.send(qrBuffer);
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
  saveCertificateTemplate,
  getCertificateTemplates,
  getCertificateTemplateById,
  getQrPlaceholderImage,
  getCertificates,
  getCertificateById,
  revokeCertificate,
  getDashboardSummary,
};
