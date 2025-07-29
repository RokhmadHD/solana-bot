import winston from 'winston';
import { config } from '../config/config.js';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
if (config.logToFile && !fs.existsSync(config.logDirectory)) {
  fs.mkdirSync(config.logDirectory, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

const transports: winston.transport[] = [];

if (config.logToConsole) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}
if (config.logToFile) {
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logDirectory, 'error.log'),
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({
      filename: path.join(config.logDirectory, 'combined.log'),
      format: logFormat
    })
  );
}

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create specialized loggers for different components
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

export const botLogger = createComponentLogger('BOT');
export const securityLogger = createComponentLogger('SECURITY');
export const snipeLogger = createComponentLogger('SNIPE');
export const monitorLogger = createComponentLogger('MONITOR');
export const webLogger = createComponentLogger('WEB');