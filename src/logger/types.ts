import { ErrorSeverity } from '../types';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogOptions {
  level?: LogLevel;
  severity?: ErrorSeverity;
  group?: string;
}

export interface ILogger {
  debug(message: string, options?: LogOptions): void;
  info(message: string, options?: LogOptions): void;
  warning(message: string, options?: LogOptions): void;
  error(message: string, options?: LogOptions): void;
  fatal(message: string, options?: LogOptions): void;
  group(name: string): void;
  groupEnd(): void;
} 