const blockedKeyPattern = /(^\$)|\./;

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]' &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (isPlainObject(value)) {
    const sanitizedObject = {};

    Object.keys(value).forEach((key) => {
      if (blockedKeyPattern.test(key)) {
        return;
      }

      sanitizedObject[key] = sanitizeValue(value[key]);
    });

    return sanitizedObject;
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeValue(req.body || {});
  req.query = sanitizeValue(req.query || {});
  req.params = sanitizeValue(req.params || {});
  next();
};

module.exports = sanitizeRequest;
