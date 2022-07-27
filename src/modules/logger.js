const { createLogger, format, transports } = require("winston");
const path = require("path");

const customFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

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
    new transports.File({
      filename: path.resolve("logs/error.log"),
      level: "error",
    }),
    new transports.File({ filename: path.resolve("logs/combined.log") }),
  ],
});

// If the environment is not production, the log is also recorded on console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple(), customFormat),
    })
  );
}

module.exports = {
  logger,
};
