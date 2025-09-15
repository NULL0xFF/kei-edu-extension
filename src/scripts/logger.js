const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class Logger {
  constructor(component = 'SYSTEM') {
    this.component = component.toUpperCase();
  }

  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  }

  log(level, message, caller, ...args) {
    if (!Object.values(LogLevel).includes(level)) return;
    if (typeof message !== 'string') message = JSON.stringify(message).slice(0, 200) + (message.length > 200 ? '...' : '');

    const timestamp = this.getTimestamp();
    const callerInfo = caller ? ` [${caller.substring(0, 16).padStart(15)}]` : '';
    const formattedMessage = `[${timestamp}] [${level.padStart(5)}] [${this.component.substring(0, 8).padStart(8)}]${callerInfo} ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  debug(message, caller, ...args) {
    this.log(LogLevel.DEBUG, message, caller, ...args);
  }

  info(message, caller, ...args) {
    this.log(LogLevel.INFO, message, caller, ...args);
  }

  warn(message, caller, ...args) {
    this.log(LogLevel.WARN, message, caller, ...args);
  }

  error(message, caller, ...args) {
    this.log(LogLevel.ERROR, message, caller, ...args);
  }
}

export default Logger;