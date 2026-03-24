import type { Response, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import logger from "@/modules/logger";

const validate = <T extends ZodTypeAny>(
  schema: T,
  input: object,
  res: Response
) => {
  try {
    const result = schema.safeParse(input);
    if (result.success) {
      return result.data;
    } else {
      res.status(400).send(result.error.flatten());
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send("internal server error");
  }
  return undefined;
};

export const validateBody = <T extends ZodTypeAny>(
  schema: T
): RequestHandler => {
  return (req, res, next) => {
    const body = validate(schema, req.body, res);
    if (body) {
      req.body = body;
      next();
    }
  };
};

export const validateQuery = <T extends ZodTypeAny>(
  schema: T
): RequestHandler => {
  return (req, res, next) => {
    const query = validate(schema, req.query, res);
    if (query) {
      req.query = query;
      next();
    }
  };
};

export const validateParams = <T extends ZodTypeAny>(
  schema: T
): RequestHandler => {
  return (req, res, next) => {
    const params = validate(schema, req.params, res);
    if (params) {
      req.params = params;
      next();
    }
  };
};
