enum LogLevel {
  OFF = 'OFF',
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogData {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: LogData;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.logLevel === LogLevel.OFF) return false;
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry, null, 2);
  }

  private log(level: LogLevel, message: string, data?: LogData, error?: Error, context?: { requestId?: string; userId?: string }): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack ?? ''
        }
      }),
      ...(context?.requestId && { requestId: context.requestId }),
      ...(context?.userId && { userId: context.userId })
    };

    console.log(this.formatLog(entry));
  }

  error(message: string, error?: Error, data?: LogData, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.ERROR, message, data, error, context);
  }

  warn(message: string, data?: LogData, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.WARN, message, data, undefined, context);
  }

  info(message: string, data?: LogData, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.INFO, message, data, undefined, context);
  }

  debug(message: string, data?: LogData, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.DEBUG, message, data, undefined, context);
  }
}

export const logger = new Logger();

// Backward compatibility
export const debugLog = (message: string, data?: any): void => {
  logger.debug(message, data);
};