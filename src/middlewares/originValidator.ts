import { type Request, type Response, type NextFunction } from "express";

const originValidatorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.origin =
    req.headers.origin ||
    req.headers.referer ||
    req.session?.loginAfterState?.redirectOrigin; // sparcssso/callback 요청은 헤더에 origin이 없음

  if (!req.origin) {
    return res.status(400).json({
      error: "Bad Request : request must have origin in header",
    });
  }
  return next();
};

export default originValidatorMiddleware;
