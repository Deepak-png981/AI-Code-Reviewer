import * as core from '@actions/core';
import { ErrorSeverity } from '../types';
import { ILogger, LogLevel, LogOptions } from './types';

/**
 * Logger class for GitHub Actions that provides structured logging
 * and integrates with GitHub Actions workflow commands.
 */
export class Logger implements ILogger {
  private groupStack: string[] = [];
  
  /**
   * Log a debug message
   */
  public debug(message: string, options?: LogOptions): void {
    this.log(message, { ...options, level: LogLevel.DEBUG });
  }

  /**
   * Log an info message
   */
  public info(message: string, options?: LogOptions): void {
    this.log(message, { ...options, level: LogLevel.INFO });
  }

  /**
   * Log a warning message
   */
  public warning(message: string, options?: LogOptions): void {
    this.log(message, { 
      ...options, 
      level: LogLevel.WARNING, 
      severity: options?.severity || ErrorSeverity.WARNING 
    });
  }

  /**
   * Log an error message
   */
  public error(message: string, options?: LogOptions): void {
    this.log(message, { 
      ...options, 
      level: LogLevel.ERROR, 
      severity: options?.severity || ErrorSeverity.ERROR 
    });
  }

  /**
   * Log a fatal error message
   */
  public fatal(message: string, options?: LogOptions): void {
    this.log(message, { 
      ...options, 
      level: LogLevel.FATAL, 
      severity: options?.severity || ErrorSeverity.FATAL 
    });
  }

  /**
   * Start a collapsible group in the GitHub Actions log
   */
  public group(name: string): void {
    core.startGroup(name);
    this.groupStack.push(name);
  }
  
  /**
   * End the current group in the GitHub Actions log
   */
  public groupEnd(): void {
    if (this.groupStack.length > 0) {
      this.groupStack.pop();
      core.endGroup();
    }
  }

  /**
   * Log a message with the specified options
   */
  private log(message: string, options: LogOptions): void {
    const { level, severity } = options;
    
    switch (level) {
      case LogLevel.DEBUG:
        core.debug(message);
        break;
      case LogLevel.INFO:
        core.info(message);
        break;
      case LogLevel.WARNING:
        core.warning(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        if (severity === ErrorSeverity.FATAL) {
          core.setFailed(message);
        } else {
          core.error(message);
        }
        break;
      default:
        core.info(message);
    }
  }
} 