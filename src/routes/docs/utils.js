const { zodToJsonSchema } = require("zod-to-json-schema");
const logger = require("../../modules/logger");

const zodToSchemaObject = (zodObejct) => {
  try {
    const schemaObject = {};
    Object.keys(zodObejct).forEach((key) => {
      schemaObject[key] = zodToJsonSchema(zodObejct[key]);
    });
    return schemaObject;
  } catch (err) {
    logger.error(`Failed to convert from zod to schema object: ${err}`);
    return {};
  }
};

module.exports = { zodToSchemaObject };
