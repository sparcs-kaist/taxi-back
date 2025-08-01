import type { RequestHandler } from "express";

// 원앱에서 보내는 sparcsso 요청은 헤더에 origin이 없음
const whitelist = ["/auth/sparcsapp/login", "/auth/sparcssso/callback"];

const originValidatorMiddleware: RequestHandler = (req, res, next) => {
  req.origin =
    req.headers.origin ||
    req.headers.referer ||
    req.session?.loginAfterState?.redirectOrigin; // sparcssso/callback 요청은 헤더에 origin이 없음

  if (!req.origin && !whitelist.includes(req.path))
    return res.status(400).json({
      error: "Bad Request : request must have origin in header",
    });

  next();
};

export default originValidatorMiddleware;
