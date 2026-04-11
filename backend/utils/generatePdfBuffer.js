const { PDFDocument, StandardFonts, degrees, rgb } = require('pdf-lib');

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const COLORS = {
  white: rgb(1, 1, 1),
  navy: rgb(0.08, 0.14, 0.28),
  gold: rgb(0.79, 0.64, 0.28),
  slate: rgb(0.22, 0.27, 0.35),
  muted: rgb(0.4, 0.46, 0.56),
  lightBlue: rgb(0.93, 0.96, 1),
  lightGold: rgb(0.98, 0.96, 0.9),
  emerald: rgb(0.05, 0.47, 0.43),
};

const formatDate = (date) => {
  if (!date) {
    return 'N/A';
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Invalid date';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const inferHeading = (certificateTitle = '') => {
  const normalized = String(certificateTitle).toLowerCase();

  if (normalized.includes('intern')) {
    return 'INTERNSHIP CERTIFICATE';
  }

  if (normalized.includes('training') || normalized.includes('bootcamp')) {
    return 'TRAINING CERTIFICATE';
  }

  if (normalized.includes('completion') || normalized.includes('workshop') || normalized.includes('hackathon')) {
    return 'CERTIFICATE OF COMPLETION';
  }

  return 'CERTIFICATE OF ACHIEVEMENT';
};

const getDisplayVerificationLink = (verificationUrl, certificateId) => {
  if (!verificationUrl) {
    return `truecert.com/verify/${certificateId}`;
  }

  try {
    const parsed = new URL(verificationUrl);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return String(verificationUrl).replace(/^https?:\/\//i, '');
  }
};

const fitTextSize = ({ text, font, maxSize, minSize, maxWidth }) => {
  let fontSize = maxSize;

  while (fontSize > minSize && font.widthOfTextAtSize(text, fontSize) > maxWidth) {
    fontSize -= 0.5;
  }

  return fontSize;
};

const wrapText = ({ text, font, fontSize, maxWidth, maxLines = 3 }) => {
  const words = String(text || '')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  if (!words.length) {
    return [''];
  }

  const lines = [];
  let line = '';

  words.forEach((word) => {
    const trial = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) {
      line = trial;
      return;
    }

    if (line) {
      lines.push(line);
      line = word;
      return;
    }

    lines.push(word);
    line = '';
  });

  if (line) {
    lines.push(line);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const clipped = lines.slice(0, maxLines);
  let overflowText = lines.slice(maxLines - 1).join(' ');

  while (font.widthOfTextAtSize(`${overflowText}...`, fontSize) > maxWidth && overflowText.length > 0) {
    overflowText = overflowText.slice(0, -1);
  }

  clipped[maxLines - 1] = `${overflowText.trim()}...`;
  return clipped;
};

const drawCenteredText = ({ page, font, text, fontSize, y, color = COLORS.navy, opacity = 1, rotate = null }) => {
  const width = font.widthOfTextAtSize(text, fontSize);
  const options = {
    x: (PAGE_WIDTH - width) / 2,
    y,
    size: fontSize,
    font,
    color,
    opacity,
  };

  if (rotate) {
    options.rotate = rotate;
  }

  page.drawText(text, options);
};

const drawImageFit = ({ page, image, x, y, maxWidth, maxHeight }) => {
  if (!image) {
    return;
  }

  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;

  page.drawImage(image, {
    x: x + (maxWidth - width) / 2,
    y: y + (maxHeight - height) / 2,
    width,
    height,
  });
};

const tryEmbedImage = async (pdfDoc, imageBuffer) => {
  if (!imageBuffer) {
    return null;
  }

  try {
    return await pdfDoc.embedPng(imageBuffer);
  } catch {
    try {
      return await pdfDoc.embedJpg(imageBuffer);
    } catch {
      return null;
    }
  }
};

const tryEmbedImageByMime = async (pdfDoc, imageBuffer, mimeType = '') => {
  if (!imageBuffer) {
    return null;
  }

  const normalizedMime = String(mimeType || '').toLowerCase();

  if (normalizedMime.includes('png')) {
    try {
      return await pdfDoc.embedPng(imageBuffer);
    } catch {
      return tryEmbedImage(pdfDoc, imageBuffer);
    }
  }

  if (normalizedMime.includes('jpg') || normalizedMime.includes('jpeg')) {
    try {
      return await pdfDoc.embedJpg(imageBuffer);
    } catch {
      return tryEmbedImage(pdfDoc, imageBuffer);
    }
  }

  return tryEmbedImage(pdfDoc, imageBuffer);
};

const drawFrame = (page) => {
  const outer = 20;
  const inner = 30;

  page.drawRectangle({
    x: outer,
    y: outer,
    width: PAGE_WIDTH - outer * 2,
    height: PAGE_HEIGHT - outer * 2,
    borderColor: COLORS.gold,
    borderWidth: 1.8,
  });

  page.drawRectangle({
    x: inner,
    y: inner,
    width: PAGE_WIDTH - inner * 2,
    height: PAGE_HEIGHT - inner * 2,
    borderColor: COLORS.navy,
    borderWidth: 1.1,
  });

  const accentLength = 26;
  const corners = [
    [inner, inner],
    [PAGE_WIDTH - inner, inner],
    [inner, PAGE_HEIGHT - inner],
    [PAGE_WIDTH - inner, PAGE_HEIGHT - inner],
  ];

  corners.forEach(([x, y]) => {
    const horizontalDirection = x > PAGE_WIDTH / 2 ? -1 : 1;
    const verticalDirection = y > PAGE_HEIGHT / 2 ? -1 : 1;

    page.drawLine({
      start: { x, y },
      end: { x: x + accentLength * horizontalDirection, y },
      thickness: 2,
      color: COLORS.gold,
    });

    page.drawLine({
      start: { x, y },
      end: { x, y: y + accentLength * verticalDirection },
      thickness: 2,
      color: COLORS.gold,
    });
  });
};

const drawPatternAndWatermark = ({ page, boldSerif, organization = 'TRUECERT' }) => {
  for (let x = -PAGE_HEIGHT; x < PAGE_WIDTH + PAGE_HEIGHT; x += 24) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x: x + PAGE_HEIGHT, y: PAGE_HEIGHT },
      color: COLORS.lightBlue,
      thickness: 0.55,
      opacity: 0.18,
    });
  }

  drawCenteredText({
    page,
    font: boldSerif,
    text: 'TRUECERT VERIFIED',
    fontSize: 64,
    y: 250,
    color: COLORS.navy,
    opacity: 0.06,
    rotate: degrees(-25),
  });

  drawCenteredText({
    page,
    font: boldSerif,
    text: String(organization || 'TRUECERT').toUpperCase(),
    fontSize: 50,
    y: 208,
    color: COLORS.gold,
    opacity: 0.05,
    rotate: degrees(-25),
  });
};

const getDurationText = (certificate) => {
  if (certificate.duration && String(certificate.duration).trim()) {
    return String(certificate.duration).trim();
  }

  const issueTime = new Date(certificate.issueDate).getTime();
  const expiryTime = new Date(certificate.expiryDate).getTime();

  if (Number.isFinite(issueTime) && Number.isFinite(expiryTime) && expiryTime > issueTime) {
    const days = Math.round((expiryTime - issueTime) / (1000 * 60 * 60 * 24));
    if (days >= 7 && days <= 365) {
      const weeks = Math.round(days / 7);
      return `${weeks} Weeks`;
    }
  }

  return 'As per program curriculum';
};

const drawHeaderAndBody = ({
  page,
  fonts,
  certificate,
  logoImage,
  signatureImage,
  qrImage,
  verificationUrl,
}) => {
  const { serif, boldSerif, sans, boldSans } = fonts;
  const contentLeft = 54;
  const contentRight = PAGE_WIDTH - 54;
  const contentWidth = contentRight - contentLeft;

  page.drawRectangle({
    x: 40,
    y: PAGE_HEIGHT - 150,
    width: PAGE_WIDTH - 80,
    height: 108,
    color: COLORS.lightGold,
    opacity: 0.35,
  });

  page.drawRectangle({
    x: contentLeft,
    y: PAGE_HEIGHT - 128,
    width: 90,
    height: 70,
    borderColor: COLORS.gold,
    borderWidth: 1,
    color: COLORS.white,
    opacity: 0.96,
  });
  drawImageFit({
    page,
    image: logoImage,
    x: contentLeft + 4,
    y: PAGE_HEIGHT - 124,
    maxWidth: 82,
    maxHeight: 62,
  });

  const heading = inferHeading(certificate.certificateTitle);
  drawCenteredText({
    page,
    font: boldSerif,
    text: heading,
    fontSize: 33,
    y: PAGE_HEIGHT - 98,
    color: COLORS.navy,
  });

  drawCenteredText({
    page,
    font: sans,
    text: 'This certificate is proudly presented to',
    fontSize: 13,
    y: PAGE_HEIGHT - 138,
    color: COLORS.muted,
  });

  page.drawLine({
    start: { x: contentLeft + 118, y: PAGE_HEIGHT - 112 },
    end: { x: contentRight - 118, y: PAGE_HEIGHT - 112 },
    thickness: 1.2,
    color: COLORS.gold,
  });

  const candidateName = String(certificate.candidateName || 'Candidate').toUpperCase();
  const candidateFontSize = fitTextSize({
    text: candidateName,
    font: boldSerif,
    maxSize: 45,
    minSize: 24,
    maxWidth: contentWidth - 70,
  });

  drawCenteredText({
    page,
    font: boldSerif,
    text: candidateName,
    fontSize: candidateFontSize,
    y: PAGE_HEIGHT - 218,
    color: COLORS.navy,
  });

  drawCenteredText({
    page,
    font: sans,
    text: 'for successfully completing',
    fontSize: 13,
    y: PAGE_HEIGHT - 246,
    color: COLORS.slate,
  });

  const titleFontSize = fitTextSize({
    text: certificate.certificateTitle,
    font: serif,
    maxSize: 24,
    minSize: 16,
    maxWidth: contentWidth - 130,
  });

  const titleLines = wrapText({
    text: certificate.certificateTitle,
    font: serif,
    fontSize: titleFontSize,
    maxWidth: contentWidth - 130,
    maxLines: 2,
  });

  titleLines.forEach((line, index) => {
    drawCenteredText({
      page,
      font: serif,
      text: line,
      fontSize: titleFontSize,
      y: PAGE_HEIGHT - 282 - index * (titleFontSize + 2),
      color: COLORS.emerald,
    });
  });

  const detailsTop = PAGE_HEIGHT - 350;
  const detailsHeight = 44;
  const detailGap = 14;
  const detailWidth = (contentWidth - detailGap * 2) / 3;

  const details = [
    `Duration: ${getDurationText(certificate)}`,
    `Grade: ${certificate.grade || 'Successfully Completed'}`,
    `Completion Date: ${formatDate(certificate.issueDate)}`,
  ];

  details.forEach((detail, index) => {
    const x = contentLeft + index * (detailWidth + detailGap);
    page.drawRectangle({
      x,
      y: detailsTop,
      width: detailWidth,
      height: detailsHeight,
      borderColor: COLORS.navy,
      borderWidth: 0.9,
      color: COLORS.white,
      opacity: 0.94,
    });

    const textSize = fitTextSize({
      text: detail,
      font: sans,
      maxSize: 11,
      minSize: 8,
      maxWidth: detailWidth - 16,
    });

    page.drawText(detail, {
      x: x + (detailWidth - sans.widthOfTextAtSize(detail, textSize)) / 2,
      y: detailsTop + (detailsHeight - textSize) / 2 + 1,
      size: textSize,
      font: sans,
      color: COLORS.slate,
    });
  });

  const descriptionText =
    (certificate.description && String(certificate.description).trim()) ||
    'In recognition of outstanding performance, dedication, and successful completion of the certified program conducted by the issuing organization.';

  const descriptionLines = wrapText({
    text: descriptionText,
    font: sans,
    fontSize: 11,
    maxWidth: contentWidth - 90,
    maxLines: 3,
  });

  const descriptionY = PAGE_HEIGHT - 416;
  page.drawRectangle({
    x: contentLeft + 18,
    y: descriptionY - 12,
    width: contentWidth - 36,
    height: 58,
    borderColor: COLORS.lightBlue,
    borderWidth: 0.8,
    color: COLORS.white,
    opacity: 0.9,
  });

  descriptionLines.forEach((line, index) => {
    drawCenteredText({
      page,
      font: sans,
      text: line,
      fontSize: 11,
      y: descriptionY + 25 - index * 14,
      color: COLORS.muted,
    });
  });

  const sectionLineY = 148;
  page.drawLine({
    start: { x: contentLeft, y: sectionLineY },
    end: { x: contentRight, y: sectionLineY },
    thickness: 1,
    color: COLORS.gold,
  });

  const gap = 24;
  const columnWidth = (contentWidth - gap * 2) / 3;
  const leftX = contentLeft;
  const centerX = leftX + columnWidth + gap;
  const rightX = centerX + columnWidth + gap;

  page.drawRectangle({
    x: leftX,
    y: 72,
    width: columnWidth,
    height: 66,
    color: COLORS.white,
    borderColor: COLORS.lightBlue,
    borderWidth: 0.8,
  });
  drawImageFit({
    page,
    image: signatureImage,
    x: leftX + 14,
    y: 86,
    maxWidth: columnWidth - 28,
    maxHeight: 36,
  });

  if (!signatureImage) {
    page.drawLine({
      start: { x: leftX + 24, y: 98 },
      end: { x: leftX + columnWidth - 24, y: 98 },
      thickness: 1,
      color: COLORS.muted,
    });
  }

  page.drawText('Authorized Signatory', {
    x: leftX + (columnWidth - boldSans.widthOfTextAtSize('Authorized Signatory', 10)) / 2,
    y: 56,
    size: 10,
    font: boldSans,
    color: COLORS.slate,
  });

  const sealCenterX = centerX + columnWidth / 2;
  const sealCenterY = 103;
  page.drawCircle({
    x: sealCenterX,
    y: sealCenterY,
    size: 38,
    borderColor: COLORS.gold,
    borderWidth: 2,
    color: COLORS.white,
    opacity: 0.95,
  });
  page.drawCircle({
    x: sealCenterX,
    y: sealCenterY,
    size: 30,
    borderColor: COLORS.navy,
    borderWidth: 1,
    opacity: 0.92,
  });

  drawCenteredText({
    page,
    font: boldSans,
    text: 'TRUECERT',
    fontSize: 10,
    y: 110,
    color: COLORS.navy,
  });

  drawCenteredText({
    page,
    font: sans,
    text: 'DIGITALLY',
    fontSize: 7,
    y: 98,
    color: COLORS.emerald,
  });

  drawCenteredText({
    page,
    font: sans,
    text: 'VERIFIED',
    fontSize: 7,
    y: 89,
    color: COLORS.emerald,
  });

  page.drawText('Digitally Verified by TrueCert', {
    x: centerX + (columnWidth - sans.widthOfTextAtSize('Digitally Verified by TrueCert', 9)) / 2,
    y: 56,
    size: 9,
    font: sans,
    color: COLORS.slate,
  });

  const rightLines = [
    `Certificate ID: ${certificate.certificateId}`,
    `Issued On: ${formatDate(certificate.issueDate)}`,
    `Issuer: ${certificate.issuerName}`,
  ];

  rightLines.forEach((line, index) => {
    page.drawText(line, {
      x: rightX + 4,
      y: 123 - index * 15,
      size: 10,
      font: index === 0 ? boldSans : sans,
      color: index === 0 ? COLORS.navy : COLORS.slate,
    });
  });

  const securityBlockX = contentLeft;
  const securityBlockY = 26;
  page.drawRectangle({
    x: securityBlockX,
    y: securityBlockY,
    width: 288,
    height: 38,
    color: COLORS.lightGold,
    borderColor: COLORS.gold,
    borderWidth: 0.8,
    opacity: 0.8,
  });

  const securityText = 'Digitally Signed   |   SHA-256 Verified   |   Tamper Protected';
  page.drawText(securityText, {
    x: securityBlockX + 10,
    y: securityBlockY + 14,
    size: 9,
    font: boldSans,
    color: COLORS.navy,
  });

  const qrSize = 92;
  const qrX = contentRight - qrSize;
  const qrY = 28;
  page.drawText('Scan to Verify Authenticity', {
    x: qrX - 8,
    y: qrY + qrSize + 18,
    size: 8.5,
    font: boldSans,
    color: COLORS.slate,
  });

  page.drawRectangle({
    x: qrX - 3,
    y: qrY - 3,
    width: qrSize + 6,
    height: qrSize + 6,
    color: COLORS.white,
    borderColor: COLORS.navy,
    borderWidth: 0.8,
  });
  drawImageFit({
    page,
    image: qrImage,
    x: qrX,
    y: qrY,
    maxWidth: qrSize,
    maxHeight: qrSize,
  });

  const verifyLink = getDisplayVerificationLink(verificationUrl, certificate.certificateId);
  const verifyFontSize = fitTextSize({
    text: verifyLink,
    font: sans,
    maxSize: 7.6,
    minSize: 6,
    maxWidth: qrSize + 20,
  });

  page.drawText(verifyLink, {
    x: qrX - 10,
    y: qrY - 12,
    size: verifyFontSize,
    font: sans,
    color: COLORS.muted,
  });
};

const generateCertificatePdfBuffer = async ({
  certificate,
  logoBuffer = null,
  signatureBuffer = null,
  qrBuffer = null,
  canvasImageBuffer = null,
  canvasImageMimeType = '',
  verificationUrl,
}) => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Certificate ${certificate.certificateId}`);
  pdfDoc.setAuthor(String(certificate.organization || 'TrueCert'));
  pdfDoc.setCreator('TrueCert Certificate Engine (pdf-lib)');
  pdfDoc.setProducer('TrueCert');
  pdfDoc.setSubject('Digitally verified certificate');
  pdfDoc.setKeywords(['certificate', 'verification', 'truecert', 'pdf-lib']);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const fonts = {
    serif: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    boldSerif: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    sans: await pdfDoc.embedFont(StandardFonts.Helvetica),
    boldSans: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  if (canvasImageBuffer) {
    const canvasImage = await tryEmbedImageByMime(pdfDoc, canvasImageBuffer, canvasImageMimeType);

    if (canvasImage) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        color: COLORS.white,
      });

      drawImageFit({
        page,
        image: canvasImage,
        x: 0,
        y: 0,
        maxWidth: PAGE_WIDTH,
        maxHeight: PAGE_HEIGHT,
      });

      const verificationLine = `Verify: ${getDisplayVerificationLink(verificationUrl, certificate.certificateId)}`;
      const metaLine = `ID: ${certificate.certificateId} | Issuer: ${certificate.issuerName}`;

      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: 22,
        color: COLORS.navy,
        opacity: 0.9,
      });

      page.drawText(verificationLine, {
        x: 18,
        y: 8,
        size: 8,
        font: fonts.sans,
        color: COLORS.white,
      });

      const metaWidth = fonts.sans.widthOfTextAtSize(metaLine, 8);
      page.drawText(metaLine, {
        x: Math.max(18, PAGE_WIDTH - metaWidth - 18),
        y: 8,
        size: 8,
        font: fonts.sans,
        color: COLORS.white,
      });

      const pdfBytesFromCanvas = await pdfDoc.save({ useObjectStreams: false });
      return Buffer.from(pdfBytesFromCanvas);
    }
  }

  const [logoImage, signatureImage, qrImage] = await Promise.all([
    tryEmbedImage(pdfDoc, logoBuffer),
    tryEmbedImage(pdfDoc, signatureBuffer),
    tryEmbedImage(pdfDoc, qrBuffer),
  ]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: COLORS.white,
  });

  drawPatternAndWatermark({
    page,
    boldSerif: fonts.boldSerif,
    organization: certificate.organization,
  });
  drawFrame(page);

  drawHeaderAndBody({
    page,
    fonts,
    certificate,
    logoImage,
    signatureImage,
    qrImage,
    verificationUrl,
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return Buffer.from(pdfBytes);
};

module.exports = generateCertificatePdfBuffer;
