import * as core from "@actions/core";

export class Config {
  private static instance: Config;

  public readonly GITHUB_TOKEN: string;
  public readonly OPENAI_API_KEY: string;
  public readonly OPENAI_API_MODEL: string;
  public readonly EXCLUDE_PATTERNS: string[];

  private constructor() {
    this.GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
    this.OPENAI_API_KEY = core.getInput("OPENAI_API_KEY");
    this.OPENAI_API_MODEL = core.getInput("OPENAI_API_MODEL");
    this.EXCLUDE_PATTERNS = core
      .getInput("exclude")
      .split(",")
      .map((s) => s.trim());
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
} 