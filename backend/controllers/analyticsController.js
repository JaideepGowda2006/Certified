const Certificate = require('../models/Certificate');
const ScanLog = require('../models/ScanLog');
const asyncHandler = require('../utils/asyncHandler');

const getCertificateIdsForUser = async (user) => {
  if (user.role === 'admin') {
    const allCertificates = await Certificate.find({}, { certificateId: 1, certificateTitle: 1, candidateName: 1 }).lean();
    return {
      ids: allCertificates.map((item) => item.certificateId),
      map: new Map(allCertificates.map((item) => [item.certificateId, item])),
    };
  }

  const certificates = await Certificate.find(
    { createdBy: user._id },
    { certificateId: 1, certificateTitle: 1, candidateName: 1 },
  ).lean();

  return {
    ids: certificates.map((item) => item.certificateId),
    map: new Map(certificates.map((item) => [item.certificateId, item])),
  };
};

const getAnalytics = asyncHandler(async (req, res) => {
  const { ids: certificateIds, map: certificateMap } = await getCertificateIdsForUser(req.user);

  if (certificateIds.length === 0) {
    res.json({
      success: true,
      analytics: {
        totalScans: 0,
        scansPerDay: [],
        topCertificates: [],
        recentScans: [],
      },
    });
    return;
  }

  const matchStage = { certificateId: { $in: certificateIds } };

  const [totalScans, scansPerDay, topCertificatesRaw, recentScans] = await Promise.all([
    ScanLog.countDocuments(matchStage),
    ScanLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$scannedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ScanLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$certificateId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    ScanLog.find(matchStage).sort({ scannedAt: -1 }).limit(20).lean(),
  ]);

  const topCertificates = topCertificatesRaw.map((item) => {
    const certificate = certificateMap.get(item._id);
    return {
      certificateId: item._id,
      scans: item.count,
      certificateTitle: certificate?.certificateTitle || 'Unknown certificate',
      candidateName: certificate?.candidateName || 'Unknown candidate',
    };
  });

  res.json({
    success: true,
    analytics: {
      totalScans,
      scansPerDay: scansPerDay.map((item) => ({ date: item._id, scans: item.count })),
      topCertificates,
      recentScans,
    },
  });
});

module.exports = {
  getAnalytics,
};
