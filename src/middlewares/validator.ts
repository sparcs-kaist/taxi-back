import { type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";

const validatorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      error: "validation : bad request",
    });
  }
  return next();
};

export default validatorMiddleware;
