const logger = require("../modules/logger");

const parseZodErrors = (statusCode, errors, res) => {
  const error_message = errors;
  res.status(statusCode).send(error_message);
};

const validate = (schema, req, res) => {
  try {
    const result = schema.safeParse(req);
    if (result.success) {
      return true;
    } else {
      parseZodErrors(400, result.error.issues[0].message, res);
    }
  } catch (err) {
    logger.error(err);
    parseZodErrors(400, err, res);
  }
};

const validateBody = (schema) => {
  return (req, res, next) => {
    if (validate(schema, req.body, res)) return next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    if (validate(schema, req.query, res)) return next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    if (validate(schema, req.params, res)) return next();
  };
};

module.exports = {
  validateParams,
  validateBody,
  validateQuery,
};
