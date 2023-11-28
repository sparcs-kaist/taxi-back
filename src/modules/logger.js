const path = require("path");
const { createLogger, format, transports } = require("winston");
const DailyRotateFileTransport = require("winston-daily-rotate-file");

const { nodeEnv } = require("@/loadenv");

// logger에서 사용할 포맷들을 정의합니다.
const baseFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss(UTCZ)" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);
const finalFormat = format.printf(
  ({ level, message, timestamp, stack }) =>
    `${timestamp} [${level}]: ${message} ${
      level === "error" && stack !== undefined ? stack : ""
    }`
);

// 파일 출력 시 사용될 포맷. 색 관련 특수문자가 파일에 쓰여지는 것을 방지하기 위해 색상이 표시되지 않습니다.
const uncolorizedFormat = format.combine(
  baseFormat,
  format.uncolorize(),
  finalFormat
);

// 콘솔 출력 시 사용될 포맷. 색상이 표시됩니다.
const colorizedFormat = format.combine(
  baseFormat,
  format.colorize({ all: true }),
  finalFormat
);

// 로그 파일명에 포함되는 시각
const datePattern = "YYYY-MM-DD-HH";
// 로그 파일당 최대 크기(=5MB).
const maxSize = 5 * 1024 * 1024;

// 콘솔에 출력하기 위한 winston transport
const consoleTransport = new transports.Console();

/**
 * console.log()와 console.error() 대신 사용되는 winston Logger 객체입니다.
 *
 * - "production" 환경: 모든 로그는 파일 시스템에 저장되고, 콘솔로도 출력됩니다.
 * - "development" & "test" 환경: 모든 로그는 콘솔에 출력됩니다.
 *
 * @method info(message: string, callback: winston.LogCallback) - 일반적인 정보(API 접근 등) 기록을 위해 사용합니다.
 * @method error(message: string, callback: winston.LogCallback)  - 오류 메시지를 기록하기 위해 사용합니다.
 */
const logger =
  nodeEnv === "production"
    ? // "production" 환경에서 사용되는 Logger 객체
      createLogger({
        level: "info",
        format: uncolorizedFormat,
        defaultMeta: { service: "sparcs-taxi" },
        transports: [
          // 전체 로그("info", "warn", "error")를 파일로 출력합니다.
          new DailyRotateFileTransport({
            level: "info",
            filename: path.resolve("logs/%DATE%-combined.log"),
            datePattern,
            maxSize,
          }),
          // 예외 처리로 핸들링 된 오류 로그("error")를 파일과 콘솔에 출력합니다.
          new DailyRotateFileTransport({
            level: "error",
            filename: path.resolve("logs/%DATE%-error.log"),
            datePattern,
            maxSize,
          }),
          consoleTransport,
        ],
        exceptionHandlers: [
          // 예외 처리가 되지 않은 오류 로그("error")를 파일과 콘솔에 출력합니다.
          new DailyRotateFileTransport({
            filename: path.resolve("logs/%DATE%-unhandled.log"),
            datePattern,
            maxSize,
          }),
          consoleTransport,
        ],
      })
    : // "development", "test" 환경에서 사용되는 Logger 객체
      createLogger({
        level: "info",
        format: colorizedFormat,
        defaultMeta: { service: "sparcs-kaist" },
        transports: [consoleTransport],
        exceptionHandlers: [consoleTransport],
      });

module.exports = logger;
