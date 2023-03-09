import pino from "pino";

const _logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

type Level = "error" | "fatal" | "warn" | "info" | "debug" | "trace";

const logger = (level: Level, message: string, details?: object) => {
  switch (level) {
    case "error":
      _logger.child(details || {}).error(message);
      break;

    case "fatal":
      _logger.child(details || {}).fatal(message);
      break;

    case "warn":
      _logger.child(details || {}).warn(message);
      break;

    case "info":
      _logger.child(details || {}).info(message);
      break;

    case "debug":
      _logger.child(details || {}).debug(message);
      break;

    case "trace":
      _logger.child(details || {}).trace(message);
      break;

    default:
      _logger.child(details || {}).info(message);
      break;
  }
};

type Logger = (level: Level, message: string, data?: object) => void;
export type { Level, Logger };
export default logger;
export { logger };
