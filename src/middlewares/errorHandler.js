const logger = require("../modules/logger");

/**
 * Express app에서 사용할 custom global error handler를 정의합니다.
 * @summary Express 핸들러에서 발생한 uncaught exception은 이 핸들러를 통해 처리됩니다.
 * Express에서 제공하는 기본 global error handler는 클라이언트에 오류 발생 call stack을 그대로 반환합니다.
 * 이 때문에 클라이언트에게 잠재적으로 보안 취약점을 노출할 수 있으므로, call stack을 반환하지 않는 error handler를 정의합니다.
 * @param {Error} err - 오류 객체
 * @param {Express.Request} req - 요청 객체
 * @param {Express.Response} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 함수. Express에서는 next 함수에 err 인자를 넘겨주면 기본 global error handler가 호출됩니다.
 */
const errorHandler = (err, req, res, next) => {
  // 이미 클라이언트에 HTTP 응답 헤더를 전송한 경우, 응답 헤더를 다시 전송하지 않아야 합니다.
  // 클라이언트에게 스트리밍 형태로 응답을 전송하는 도중 오류가 발생하는 경우가 여기에 해당합니다.
  // 이럴 때 기본 global error handler를 호출하면 기본 global error handler가 클라이언트와의 연결을 종료시켜 줍니다.
  logger.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send("internal server error");
};

module.exports = errorHandler;
