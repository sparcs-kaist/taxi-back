const Ajv = require("ajv");
const ajvErrors = require("ajv-errors");
const addFormats = require("ajv-formats").default;

const ajv = new Ajv({ verbose: true, allErrors: true });
addFormats(ajv);
ajvErrors(ajv /*, {singleError: true} */);

const parseAjvErrors = (errors, res) => {
  const error_message = errors;
  res.status(400).send(error_message);
};

const validate = (schema, req, res) => {
  const validate = ajv.compile(schema);
  if (validate(req)) {
    return true;
  } else {
    parseAjvErrors(validate.errors[0].message, res);
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
