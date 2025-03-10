import * as core from "@actions/core";
import { ErrorHandler } from "../handlers/error";

export class Config {
  private static instance: Config;
  private errorHandler: ErrorHandler;

  public readonly GITHUB_TOKEN: string;
  public readonly OPENAI_API_KEY: string;
  public readonly OPENAI_API_MODEL: string;
  public readonly EXCLUDE_PATTERNS: string[];

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();

    this.GITHUB_TOKEN = this.getRequiredParam("GITHUB_TOKEN");
    this.OPENAI_API_KEY = this.getRequiredParam("OPENAI_API_KEY");
    this.OPENAI_API_MODEL = this.getParamWithDefault("OPENAI_API_MODEL", "gpt-3.5-turbo",
      "No OPENAI_API_MODEL provided, using default model");
    this.EXCLUDE_PATTERNS = this.getArrayParam("exclude");
  }

  private getRequiredParam(name: string): string {
    const value = core.getInput(name);
    if (!value || value.trim() === "") {
      this.errorHandler.handleMissingRequiredParam(name);
    }
    return value;
  }

  private getParamWithDefault(name: string, defaultValue: string, infoMessage?: string): string {
    const value = core.getInput(name);
    if (!value || value.trim() === "") {
      if (infoMessage) {
        core.info(infoMessage);
      }
      return defaultValue;
    }
    return value;
  }

  private getArrayParam(name: string): string[] {
    return core
      .getInput(name)
      .split(",")
      .map((s) => s.trim())
      .filter(s => s.length > 0);
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
} 
