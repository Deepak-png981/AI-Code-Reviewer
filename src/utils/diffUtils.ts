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
    return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.
- IMPORTANT: Donot comment on the formatting of the code.
- IMPORTANT: Classify the comments in three groupts nit , minor and major. The "nit" comments are comments that are not important and can be ignored. The "minor" comments are comments that are important and should be addressed. The "major" comments are comments that are critical and must be addressed. Each of your comment should start with nit: , minor: or major: <comment>

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