import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export const WinstonConfig: winston.LoggerOptions = {
  level: isProduction ? 'warn' : 'debug',
  transports: [
    // Console — pretty in dev, JSON in production
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike('LMS-API', {
              prettyPrint: true,
            }),
          ),
    }),

    // Error log file — always active
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Combined log — production only
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 20 * 1024 * 1024, // 20MB
            maxFiles: 10,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ]
      : []),
  ],
};
