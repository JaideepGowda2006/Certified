const { v2: cloudinary } = require('cloudinary');

const configureCloudinary = () => {
  if (process.env.DEMO_MODE === 'true') {
    console.warn('DEMO_MODE is enabled. Cloudinary uploads are replaced with local data URLs.');
    return;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  const hasCloudName = Boolean(CLOUDINARY_CLOUD_NAME);
  const hasApiKey = Boolean(CLOUDINARY_API_KEY);
  const hasApiSecret = Boolean(CLOUDINARY_API_SECRET);
  const hasAllCredentials = hasCloudName && hasApiKey && hasApiSecret;

  if (!hasAllCredentials) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cloudinary credentials are missing in environment variables.');
    }

    console.warn(
      'Cloudinary credentials are missing. Upload-dependent features are disabled until backend/.env is configured.',
    );
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
};

module.exports = configureCloudinary;
