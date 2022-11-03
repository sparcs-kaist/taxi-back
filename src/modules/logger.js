const { createLogger, format, transports } = require("winston");
const dailyRotateFileTransport = require("winston-daily-rotate-file");
const path = require("path");

const { nodeEnv } = require("../../security");

// 로깅에 사용하기 위한 포맷을 추가로 정의합니다.
const customFormat = {
  time: "YYYY-MM-DD HH:mm:ss", // 로깅 시각
  line: format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${message} ${
      level === "error" ? stack : ""
    }`;
  }), // 메시지 포맷
  fileDate: "YYYY-MM-DD-HH", // 파일명에 포함되는 시각
};

/**
 * console.log 대신 사용되는 winston Logger 객체입니다.
 *
 * 전체 로그는 *.combined.log 파일에, 예외 처리로 핸들링 된 오류 로그는 *.error.log 파일에, 예외 처리가 되지 않은 오류는 *.unhandled.log에 저장됩니다.
 * @property {function} info() - 일반적인 정보 기록을 위한 로깅(API 접근 기록 등)을 위해 사용합니다.
 * @property {function} error() - 오류 메시지를 로깅하기 위해 사용합니다.
 */
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: customFormat.time }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    customFormat.line
  ),
  defaultMeta: { service: "sparcs-taxi" },
  transports: [
    new dailyRotateFileTransport({
      filename: path.resolve("logs/%DATE%-combined.log"),
      datePattern: customFormat.fileDate,
      maxsize: 5242880, // 5MB
      level: "info",
    }),
    new dailyRotateFileTransport({
      filename: path.resolve("logs/%DATE%-error.log"),
      datePattern: customFormat.fileDate,
      maxsize: 5242880, // 5MB
      level: "error",
    }),
  ],
  exceptionHandlers: [
    new dailyRotateFileTransport({
      filename: path.resolve("logs/%DATE%-unhandled.log"),
      datePattern: customFormat.fileDate,
      maxsize: 5242880, // 5MB
    }),
  ],
});

// If the environment is not production, the log is also recorded on console
if (nodeEnv !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: customFormat.time }),
        format.errors({ stack: true }),
        format.splat(),
        format.colorize(),
        customFormat.line
      ),
    })
  );
}

module.exports = logger;
