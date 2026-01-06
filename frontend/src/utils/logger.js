const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] [SecureTransac] ${message}`;

  switch (level) {
    case LOG_LEVELS.INFO:
      console.log(formattedMessage, ...args);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage, ...args);
      break;
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage, ...args);
      break;
    default:
      console.log(formattedMessage, ...args);
  }
};

export const logger = {
  info: (message, ...args) => log(LOG_LEVELS.INFO, message, ...args),
  warn: (message, ...args) => log(LOG_LEVELS.WARN, message, ...args),
  error: (message, ...args) => log(LOG_LEVELS.ERROR, message, ...args),
};
