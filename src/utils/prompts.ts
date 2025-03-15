import { PRDetails, Prompt } from "../types";
import { File, Chunk } from "parse-diff";

export function createCodeReviewPrompt(
  file: File,
  chunk: Chunk,
  prDetails: PRDetails
): Prompt {
  return `
# Code Review Task

## Response Format
Provide your response in the following **JSON** format:

\`\`\`json
{
  "reviews": [
    {
      "lineNumber": <line_number>,
      "reviewComment": "<review comment>",
      "suggestion": "<suggested code snippet>" // Optional; only include this if you have specific code changes to propose
    }
  ]
}
\`\`\`

- **Important**: 
  - If you have a suggestion, the \`suggestion\` field **must only contain the replacement changes**—no extra commentary or markdown.
  - Put any explanations, rationale, or severity labels in the \`reviewComment\` field.

## Review Guidelines
- Do **not** give positive comments or compliments.
- Provide comments and suggestions **only** if there is something to improve; otherwise, return \`{"reviews": []}\`.
- Write the comment in GitHub Markdown format.
- Use the pull request description only for context; focus your review on the code changes.
- Classify each comment with one of these severity levels:
  - **nit**: Minor stylistic issues that don't affect functionality.
  - **minor**: Small issues that should be fixed but don't impact overall functionality.
  - **major**: Significant problems that could cause bugs, performance issues, or security vulnerabilities.
- Start each comment with the appropriate severity label, e.g., "**[major]** This could cause..."

## Important Rules
- **Never** suggest adding comments to the code.
- Focus on code content, logic, and potential bugs—**not** formatting or documentation.
- When providing a suggestion, include **only** the exact code snippet to replace the problematic code.
- Keep suggestions concise and directly applicable.

## Pull Request Information
- **File**: \`${file.to}\`
- **Title**: \`${prDetails.title}\`

**Description**:
\`\`\`
${prDetails.description}
\`\`\`

## Git Diff to Review
\`\`\`diff
${chunk.content}
${chunk.changes
  // @ts-expect-error - ln and ln2 exist where needed
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
}
