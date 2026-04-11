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
  getDashboardSummary,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');
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
router.post('/templates', issueLimiter, saveCertificateTemplate);
router.get('/qr-image', getQrPlaceholderImage);

router.get('/', getCertificates);
router.get('/summary/dashboard', getDashboardSummary);
router.post(
  '/create',
  issueLimiter,
  upload.fields(createCertificateUploadFields),
  validateUploadedImages,
  createCertificate,
);
router.post(
  '/',
  issueLimiter,
  upload.fields(createCertificateUploadFields),
  validateUploadedImages,
  createCertificate,
);
router.get('/:certificateId', getCertificateById);
router.patch('/:certificateId/revoke', revokeCertificate);

module.exports = router;
