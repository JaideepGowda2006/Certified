const express = require('express');
const {
  createCertificate,
  saveCertificateTemplate,
  getCertificateTemplates,
  getCertificateTemplateById,
  getQrPlaceholderImage,
  getCertificates,
  getCertificateById,
  revokeCertificate,
  unrevokeCertificate,
  updateCertificate,
  deleteCertificate,
  getDashboardSummary,
} = require('../controllers/certificateController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { upload, validateUploadedImages } = require('../middleware/uploadMiddleware');
const { issueLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

const createCertificateUploadFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'seal', maxCount: 1 },
  { name: 'watermark', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'generatedImage', maxCount: 1 },
  { name: 'certificateImage', maxCount: 1 },
];

router.use(protect);

router.get('/templates', getCertificateTemplates);
router.get('/templates/:templateId', getCertificateTemplateById);
router.post('/templates', authorizeRoles('admin', 'issuer'), issueLimiter, saveCertificateTemplate);
router.get('/qr-image', getQrPlaceholderImage);

router.get('/', getCertificates);
router.get('/summary/dashboard', getDashboardSummary);
router.post(
  '/create',
  authorizeRoles('admin', 'issuer'),
  issueLimiter,
  upload.fields(createCertificateUploadFields),
  validateUploadedImages,
  createCertificate,
);
router.post(
  '/',
  authorizeRoles('admin', 'issuer'),
  issueLimiter,
  upload.fields(createCertificateUploadFields),
  validateUploadedImages,
  createCertificate,
);
router.get('/:certificateId', getCertificateById);
router.put('/:certificateId', authorizeRoles('admin', 'issuer'), updateCertificate);
router.patch('/:certificateId', authorizeRoles('admin', 'issuer'), updateCertificate);
router.patch('/:certificateId/revoke', authorizeRoles('admin', 'issuer'), revokeCertificate);
router.patch('/:certificateId/unrevoke', authorizeRoles('admin', 'issuer'), unrevokeCertificate);
router.post('/:certificateId/unrevoke', authorizeRoles('admin', 'issuer'), unrevokeCertificate);
router.delete('/:certificateId', authorizeRoles('admin', 'issuer'), deleteCertificate);

module.exports = router;
