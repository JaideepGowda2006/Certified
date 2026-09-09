const { v2: cloudinary } = require('cloudinary');

const isDemoMode = () => process.env.DEMO_MODE === 'true';

const getDemoDataUrl = (buffer, options) => {
  const mimeType = options.resource_type === 'raw'
    ? 'application/pdf'
    : options.format === 'webp'
      ? 'image/webp'
      : options.format === 'jpg'
        ? 'image/jpeg'
        : 'image/png';

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

const uploadBufferToCloudinary = (buffer, options = {}) => {
  if (isDemoMode()) {
    return Promise.resolve({
      secure_url: getDemoDataUrl(buffer, options),
      public_id: options.public_id || `demo_asset_${Date.now()}`,
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
};

module.exports = uploadBufferToCloudinary;
