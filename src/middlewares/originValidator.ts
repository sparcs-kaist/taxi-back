import type { RequestHandler } from "express";

const whitelist = [
  "/auth/sparcssso/callback", // SPARCS SSO 콜백 요청의 헤더에는 origin이 없음
  "/auth/sparcsapp/login", // 원앱에서 보내는 로그인 요청의 헤더에는 origin이 없음
];

const originValidatorMiddleware: RequestHandler = (req, res, next) => {
  req.origin = req.headers.origin || req.headers.referer;

  if (!req.origin && !whitelist.includes(req.path)) {
    return res.status(400).json({
      error: "Bad Request : request must have origin in header",
    });
  }

  next();
};

export default originValidatorMiddleware;
