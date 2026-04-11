const express = require('express');
const {
  createCertificate,
  getCertificates,
  getCertificateById,
  revokeCertificate,
  getDashboardSummary,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');
const { upload, validateUploadedImages } = require('../middleware/uploadMiddleware');
const { issueLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.use(protect);

router.get('/', getCertificates);
router.get('/summary/dashboard', getDashboardSummary);
router.post(
  '/',
  issueLimiter,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ]),
  validateUploadedImages,
  createCertificate,
);
router.get('/:certificateId', getCertificateById);
router.patch('/:certificateId/revoke', revokeCertificate);

module.exports = router;
