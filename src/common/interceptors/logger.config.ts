import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilites } from 'nest-winston';

export const WinstonConfig: winston.LoggerOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilites.format.nestLike('LMS-API', {
          prettyPrint: true,
        }),
      ),
    }),

    new winston.transports.File({
      filename: 'errorLogs.txt',
      level: 'error',
    }),
  ],
};
