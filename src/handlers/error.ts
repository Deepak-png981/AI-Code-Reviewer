import * as core from "@actions/core";
import { ErrorSeverity } from "../types";

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(message: string, severity: ErrorSeverity = ErrorSeverity.ERROR, error?: Error): void {
    const formattedMessage = error ? `${message}: ${error.message}` : message;
    
    switch (severity) {
      case ErrorSeverity.WARNING:
        core.warning(formattedMessage);
        break;
      
      case ErrorSeverity.ERROR:
        core.error(formattedMessage);
        core.setFailed(formattedMessage);
        break;
      
      case ErrorSeverity.FATAL:
        core.error(formattedMessage);
        core.setFailed(formattedMessage);
        break;
    }

    if (error && error.stack) {
      core.info(`Stack trace: ${error.stack}`);
    }
  }

  public handleConfigError(message: string, error?: Error): void {
    this.handleError(`Configuration Error: ${message}`, ErrorSeverity.FATAL, error);
  }

  public handleMissingRequiredParam(paramName: string): void {
    this.handleConfigError(`Required parameter '${paramName}' is missing or empty`);
  }
}
