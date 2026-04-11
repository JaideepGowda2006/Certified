const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PNG, JPG, JPEG, and WEBP image files are allowed.'), false);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

const isPng = (buffer) => {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return pngSignature.every((byte, index) => buffer[index] === byte);
};

const isJpeg = (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

const isWebp = (buffer) => {
  if (buffer.length < 12) {
    return false;
  }

  const riff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const webp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return riff && webp;
};

const matchesSignature = (file) => {
  if (!file?.buffer || file.buffer.length < 12) {
    return false;
  }

  if (file.mimetype === 'image/png') {
    return isPng(file.buffer);
  }

  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    return isJpeg(file.buffer);
  }

  if (file.mimetype === 'image/webp') {
    return isWebp(file.buffer);
  }

  return false;
};

const validateUploadedImages = (req, res, next) => {
  const fileGroups = Object.values(req.files || {});

  for (const files of fileGroups) {
    for (const file of files) {
      if (!matchesSignature(file)) {
        res.status(400);
        next(new Error('Uploaded file content does not match the declared image format.'));
        return;
      }
    }
  }

  next();
};

module.exports = {
  upload,
  validateUploadedImages,
};
