import type { RequestHandler } from "express";
import { validationResult } from "express-validator";

const validatorMiddleware: RequestHandler = (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty())
    return res.status(400).json({
      error: "validation : bad request",
    });

  next();
};

export default validatorMiddleware;
