const express = require('express');
const { verifyCertificate, streamProtectedPdf } = require('../controllers/verifyController');
const { verifyLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/:certificateId', verifyLimiter, verifyCertificate);
router.get('/:certificateId/pdf', verifyLimiter, streamProtectedPdf);

module.exports = router;
