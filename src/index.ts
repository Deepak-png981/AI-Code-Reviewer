import { PRReviewHandler } from "./handlers/PRReviewHandler";
const core = require('@actions/core');

(async () => {
  try {
    core.info('Running Review Raccoon...');    
    const handler = new PRReviewHandler();
    await handler.process();
  } catch (error) {
    core.error('An error occurred:', error);
    core.setFailed('Action failed with error');
    process.exit(1);
  }
})()