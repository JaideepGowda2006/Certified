const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const resolveIpAddress = (req) => {
  const forwardedHeader = req.headers['x-forwarded-for'];

  if (typeof forwardedHeader === 'string' && forwardedHeader.length > 0) {
    return forwardedHeader.split(',')[0].trim();
  }

  if (Array.isArray(forwardedHeader) && forwardedHeader.length > 0) {
    return forwardedHeader[0];
  }

  return req.ip || req.socket.remoteAddress || '0.0.0.0';
};

const getClientMeta = (req) => {
  const rawIp = resolveIpAddress(req);
  const ipAddress = rawIp.replace('::ffff:', '');

  const parser = new UAParser(req.headers['user-agent'] || '');
  const browserInfo = parser.getBrowser();
  const osInfo = parser.getOS();
  const deviceInfo = parser.getDevice();

  const browser = [browserInfo.name, browserInfo.version].filter(Boolean).join(' ') || 'Unknown';
  const device = deviceInfo.type || osInfo.name || 'Desktop';
  const geo = geoip.lookup(ipAddress);

  return {
    ipAddress,
    browser,
    device,
    city: geo?.city || 'Unknown',
    country: geo?.country || 'Unknown',
  };
};

module.exports = getClientMeta;
