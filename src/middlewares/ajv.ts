import Ajv from "ajv";
import ajvErrors from "ajv-errors";
import { default as addFormats } from "ajv-formats";
import { type Request, type Response, type NextFunction } from "express";

const ajv = new Ajv({ verbose: true, allErrors: true });
addFormats(ajv);
ajvErrors(ajv);

const validate = (schema: Object, req: Request, res: Response) => {
  const validate = ajv.compile(schema);
  if (validate(req)) {
    return true;
  } else {
    res.status(400).send(validate.errors?.[0].message ?? "Validation Error"); // TODO: 에러 메시지 수정
    return false;
  }
};

export const validateBody = (schema: Object) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (validate(schema, req, res)) return next();
  };
};

export const validateQuery = (schema: Object) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (validate(schema, req, res)) return next();
  };
};

export const validateParams = (schema: Object) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (validate(schema, req, res)) return next();
  };
};
