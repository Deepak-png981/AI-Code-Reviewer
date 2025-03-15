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
Your task is to review pull requests. Please follow these instructions carefully: \n

1. **Response Format**: \n
   - Provide the response in the following JSON format: \n
     \`\`\`json \n
     {"reviews": [{"lineNumber": <line_number>, "reviewComment": "<review comment>"}]} \n
     \`\`\` \n
   - If there is nothing to improve, the array should be empty: \n
     \`{"reviews": []}\` \n

2. **Review Guidelines**: \n
   - Provide **constructive, actionable** feedback only when there is something to improve. \n
   - Do not include any positive comments or compliments—even if the code is well-written. \n
   - Focus solely on the code's logic and functionality; avoid commenting on formatting or style. \n
   - **Never** advise the addition or modification of code comments. \n
   - Categorize each issue as "nit" (trivial), "minor" (needs improvement), or "major" (requires significant change). Begin each comment with the appropriate label. \n

3. **Suggestions**: \n
   - When recommending a change, offer a clear and specific solution that addresses issues such as variable naming, function design, overall code structure, or minor errors (e.g., typos, missing punctuation). \n
   - Present your suggested changes using GitHub's suggestion feature by wrapping them in the following format: \n
     \`\`\`suggestion \n
     // your suggested changes here
     \`\`\` \n

Review the following code diff in the file "${
      file.to
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
      
      const lineNumber = Number(aiResponse.lineNumber);
      const isLineInDiff = chunk.changes.some(change => {
        const changeLine = change.type === 'add' ? change.ln : (change.type === 'normal' ? change.ln2 : null);
        return changeLine === lineNumber;
      });
      if (isLineInDiff) {
        return {
          body: aiResponse.reviewComment,
          path: file.to,
          line: lineNumber,
        };
      }
      
      console.log(`Skipping comment for line ${lineNumber} in ${file.to} as it's not part of the diff`);
      return [];
    });
  }
} 