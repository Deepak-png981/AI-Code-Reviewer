import { PRReviewHandler } from "./handlers/PRReviewHandler";

(async () => {
  try {
    const handler = new PRReviewHandler();
    await handler.process();
  } catch (error) {
    console.error("Error occurred during PR review process:", error);
    process.exit(1);
  }
})()