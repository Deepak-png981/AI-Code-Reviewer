import parseDiff, { Chunk, File } from "parse-diff";
import minimatch from "minimatch";
import { AIResponse, PRDetails, Prompt, ReviewComment } from "../types";

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
    return `
Your task is to review pull requests. Instructions: \n
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]} \n
- Do not give positive comments or compliments. \n
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array. \n
- Write the comment in GitHub Markdown format. \n
- Use the given description only for the overall context and only comment the code. \n
- IMPORTANT: NEVER suggest adding comments to the code. \n
- IMPORTANT: Focus on code content, not formatting or adding comments. \n
- NOTE: Classify comments as "nit", "minor", or "major". Start each comment with the appropriate label. \n
- You can suggest changes using the suggest feature of GitHub comments but do make sure to use it when it makes sense. \n
- For Example: better variable names, better function names, better code structure or spelling error or grammatical error or missing semicolons or commas or better log/print statements or something else. \n
- When suggesting code changes, use GitHub's suggestion format by wrapping your suggested changes with: \n
  \`\`\`suggestion \n
  your suggested changes here \n
  \`\`\` \n

Review the following code diff in the file "${file.to
      }" and take the pull request title and description into account when writing the response. \n
  
Pull request title: ${prDetails.title} \n
Pull request description: \n

--- \n
${prDetails.description} \n
--- \n

Git diff to review: \n

\`\`\`diff \n
${chunk.content} \n
${chunk.changes
        // @ts-expect-error - ln and ln2 exists where needed
        .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
        .join("\n")} \n
\`\`\` \n
`;
  }

  public static createReviewComments(
    file: File,
    chunk: Chunk,
    aiResponses: AIResponse[]
  ): ReviewComment[] {
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