import OpenAI from "openai";
import { AIResponse, OpenAIConfig } from "../types";
import { Config } from "../config";

export class AIService {
  private openai: OpenAI;
  private config: Config;
  private static instance: AIService;

  private constructor() {
    this.config = Config.getInstance();
    this.openai = new OpenAI({
      apiKey: this.config.OPENAI_API_KEY,
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async getReviewComments(prompt: string): Promise<AIResponse[] | null> {
    const queryConfig: OpenAIConfig = {
      model: this.config.OPENAI_API_MODEL,
      temperature: 0.2,
      max_tokens: 700,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    try {
      const response = await this.openai.chat.completions.create({
        ...queryConfig,
        ...(this.config.OPENAI_API_MODEL === "gpt-4-1106-preview"
          ? { response_format: { type: "json_object" } }
          : {}),
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
      });

      const res = response.choices[0].message?.content?.trim() || "{}";
      return JSON.parse(res).reviews;
    } catch (error) {
      console.error("Error in AI service:", error);
      return null;
    }
  }
} 