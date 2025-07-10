import type { RequestHandler } from "express";

const originValidatorMiddleware: RequestHandler = (req, res, next) => {
  req.origin =
    req.headers.origin ||
    req.headers.referer ||
    req.session?.loginAfterState?.redirectOrigin; // sparcssso/callback 요청은 헤더에 origin이 없음

  // 원앱에서 보내는 sparcsso 요청은 헤더에 origin이 없음
  if (!req.origin && req.path !== "/auth/sparcsapp/login")
    return res.status(400).json({
      error: "Bad Request : request must have origin in header",
    });

  next();
};

export default originValidatorMiddleware;
