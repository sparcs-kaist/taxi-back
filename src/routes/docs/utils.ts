import { z, ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import logger from "@/modules/logger";

type ZodObject = Record<string, ZodTypeAny>;

export const zodToSchemaObject = (zodObejct: ZodObject) => {
  try {
    const schemaObject: Record<string, any> = {};
    Object.keys(zodObejct).forEach((key) => {
      schemaObject[key] = zodToJsonSchema(zodObejct[key]);
    });
    return schemaObject;
  } catch (err) {
    logger.error(`Failed to convert from zod to schema object: ${err}`);
    return {};
  }
};

export const zStringToBoolean = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
