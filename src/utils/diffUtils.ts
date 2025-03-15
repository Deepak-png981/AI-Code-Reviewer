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
    // Build diff lines outside of the main template literal.
    const diffLines = chunk.changes
      // @ts-expect-error - ln and ln2 exist where needed
      .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
      .join("\n");

    return `
Your task is to review pull requests. Please follow these instructions carefully:

1. **Response Format**:
   - Provide the response in the following JSON format:
     \`\`\`json
     {"reviews": [{"lineNumber": <line_number>, "reviewComment": "<review comment>"}]}
     \`\`\`
   - If there is nothing to improve, the array should be empty:
     \`{"reviews": []}\`

2. **Review Guidelines**:
   - Provide **constructive, actionable** feedback only when there is something to improve.
   - Do not include any positive comments or compliments—even if the code is well-written.
   - Focus solely on the code's logic and functionality; avoid commenting on formatting or style.
   - **Never** advise the addition or modification of code comments.
   - Categorize each issue as "nit" (trivial), "minor" (needs improvement), or "major" (requires significant change). Begin each comment with the appropriate label.

3. **Suggestions**:
   - When recommending a change, offer a clear and specific solution that addresses issues such as variable naming, function design, overall code structure, or minor errors (e.g., typos, missing punctuation) or anything else that can be suggested in a suggestion.
   - Present your suggested changes using GitHub’s suggestion feature by wrapping them in the following format:
     \`\`\`suggestion
     // your suggested changes here
     \`\`\`


4. **Pull Request Context**:
   - **Title**: \`${prDetails.title}\`
   - **Description**:
     \`\`\`
     ${prDetails.description}
     \`\`\`

5. **Code to Review**:
   - **File**: \`${file.to}\`
   - **Diff**:
     \`\`\`diff
     ${chunk.content}
     ${diffLines}
     \`\`\`

Please generate your review based on these guidelines.
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
