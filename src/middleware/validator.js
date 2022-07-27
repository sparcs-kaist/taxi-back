const { validationResult } = require("express-validator");

module.exports = (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      error: "validation : bad request",
    });
  }
  next();
};
