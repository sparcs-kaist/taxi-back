const { zodToJsonSchema } = require("zod-to-json-schema");
const logger = require("../../modules/logger").default;
const { z } = require("zod");

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

const zStringToBoolean = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

module.exports = { zodToSchemaObject, zStringToBoolean };
