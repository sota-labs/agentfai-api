import Transport from 'winston-transport';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import util from 'util';

function safeToString(json: any): string {
  if (isEmpty(json)) {
    return null;
  }

  try {
    return JSON.stringify(json);
  } catch (ex) {
    return util.inspect(json);
  }
}

function isEmpty(obj: any): boolean {
  if (obj == null) return true;

  if (obj.length > 0) return false;
  if (obj.length === 0) return true;

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if (typeof obj !== 'object') return true;

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

const { combine, colorize, printf } = winston.format;
const { timestamp } = winston.format;

const LogTransport = {
  Console: 'consoleLog',
  DailyRotateFile: 'dailyRotateFileLog',
};

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    const output = Object.assign(
      {
        message: info.message,
        stack: info.stack,
      },
      info,
    );

    return output;
  }
  return info;
});

const createDailyRotateFile = (name) => {
  return new DailyRotateFile({
    filename: `${name}-%DATE%.log`,
    format: combine(
      colorize(),
      printf((info) => {
        const { timestamp, level, message, ...extra } = info;
        return `${timestamp} [${level}]: ${message}` + (isEmpty(extra) ? '' : ` | ${safeToString(extra)}`);
      }),
    ),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '1024m',
    maxFiles: '14d',
    utc: true,
    dirname: process.env.APP_LOGS_PATH || `${process.cwd()}/logs`,
  });
};

const getConfigTransports = (transportNames: string[], name?: string) => {
  const configTransports = [];
  if (transportNames.includes(LogTransport.Console)) {
    configTransports.push(
      new winston.transports.Console({
        format: combine(
          colorize(),
          printf((info) => {
            const { timestamp, level, message, ...extra } = info;
            return (
              `${timestamp} [${level}] [${name}]: ${message}` + (isEmpty(extra) ? '' : ` | ${safeToString(extra)}`)
            );
          }),
        ),
      }),
    );
  }
  if (transportNames.includes(LogTransport.DailyRotateFile)) {
    configTransports.push(createDailyRotateFile(name));
  }
  return configTransports;
};

const defaultTransports = getConfigTransports([LogTransport.Console]);

export class LoggerUtils {
  static get(name = '', transportNames: string[] = [LogTransport.Console]): winston.Logger {
    const isLoggerExisted = winston.loggers.has(name as string);
    if (!isLoggerExisted) {
      this.create(name, transportNames);
    }

    return winston.loggers.get(name as string);
  }

  private static create = (name?: string, transportNames?: string[]) => {
    const transports: Transport[] = [];
    if (transportNames) {
      const configTransports = getConfigTransports(transportNames, name);
      transports.push(...configTransports);
    } else {
      transports.push(...(defaultTransports as any));
    }
    winston.loggers.add(name as string, {
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(timestamp(), enumerateErrorFormat()),
      transports,
    });
  };
}
