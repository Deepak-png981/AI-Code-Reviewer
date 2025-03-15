import parseDiff, { Chunk, File } from "parse-diff";
import minimatch from "minimatch";
import { AIResponse, PRDetails, Prompt, ReviewComment } from "../types";
import * as core from '@actions/core';
import { createCodeReviewPrompt } from "./prompts";

export class DiffUtils {
  public static parseDiff(diff: string): File[] {
    return parseDiff(diff);
  }

  public static filterDiff(files: File[], excludePatterns: string[]): File[] {
    return files.filter((file) => {
      return !excludePatterns.some((pattern) =>
        minimatch(file.to ?? "", pattern)
      );
    });
  }

  public static createPrompt(file: File, chunk: Chunk, prDetails: PRDetails): Prompt {
    return createCodeReviewPrompt(file, chunk, prDetails);
  }

  public static createReviewComments(
    file: File,
    chunk: Chunk,
    aiResponses: AIResponse[]
  ): ReviewComment[] {
    core.info(`Creating review comments for file: ${file.to}`);
    core.info(`AI responses: ${JSON.stringify(aiResponses)}`);
    return aiResponses.flatMap((aiResponse) => {
      if (!file.to) {
        return [];
      }

      const body = aiResponse.suggestion
        ? `${aiResponse.reviewComment}\n\n\`\`\`suggestion ${aiResponse.suggestion} \`\`\`` : aiResponse.reviewComment;
      core.info(`Review comment: ${body}`);
      return {
        body: body,
        path: file.to,
        line: Number(aiResponse.lineNumber),
      };
    });
  }
} 