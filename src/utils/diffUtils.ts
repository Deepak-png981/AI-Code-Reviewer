import parseDiff, { Chunk, File } from "parse-diff";
import minimatch from "minimatch";
import { AIResponse, PRDetails, Prompt, ReviewComment } from "../types";
import * as core from '@actions/core';

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
    return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.
- IMPORTANT: Focus on code content, not formatting or adding comments.
- NOTE: Classify comments as "nit", "minor", or "major". Start each comment with the appropriate label.

Review the following code diff in the file "${
      file.to
    }" and take the pull request title and description into account when writing the response.
  
Pull request title: ${prDetails.title}
Pull request description:

---
${prDetails.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
  // @ts-expect-error - ln and ln2 exists where needed
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
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
      return {
        body: aiResponse.reviewComment,
        path: file.to,
        line: Number(aiResponse.lineNumber),
      };
    });
  }
} 