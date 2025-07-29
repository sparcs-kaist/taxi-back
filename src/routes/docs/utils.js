const { zodToJsonSchema } = require("zod-to-json-schema");
const logger = require("../../modules/logger").default;

const zodToSchemaObject = (zodObject) => {
  try {
    const schemaObject = {};
    Object.keys(zodObject).forEach((key) => {
      schemaObject[key] = zodToJsonSchema(zodObject[key]);
    });
    return schemaObject;
  } catch (err) {
    logger.error(`Failed to convert from zod to schema object: ${err}`);
    return {};
  }
};

module.exports = { zodToSchemaObject };
