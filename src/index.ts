import { PRReviewHandler } from "./handlers/PRReviewHandler";

async function main() {
  try {
    const handler = new PRReviewHandler();
    await handler.process();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 