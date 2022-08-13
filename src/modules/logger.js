const { createLogger, format, transports } = require("winston");
const dailyRotateFileTransport = require("winston-daily-rotate-file");
const path = require("path");

// Define custom format for the logs
const customFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const datePattern = "YYYY-MM-DD-HH-mm";

// Create a new logger
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    customFormat
  ),
  defaultMeta: { service: "sparcs-taxi" },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new dailyRotateFileTransport({
      filename: path.resolve("logs/error-%DATE%.log"),
      datePattern,
      maxsize: 5242880, // 5MB
      level: "error",
    }),
    new dailyRotateFileTransport({
      filename: path.resolve("logs/combined-%DATE%.log"),
      datePattern,
      maxsize: 5242880, // 5MB
    }),
  ],
});

// If the environment is neither production nor test, the log is also recorded on console
if (process.env.NODE_ENV !== "production" || process.env.NODE_ENV !== "test") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple(), customFormat),
    })
  );
}

module.exports = logger;
