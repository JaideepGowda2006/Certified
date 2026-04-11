const QRCode = require('qrcode');

const generateQrBuffer = async (verificationUrl) => {
  const buffer = await QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 480,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return buffer;
};

module.exports = generateQrBuffer;
