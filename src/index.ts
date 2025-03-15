import { PRReviewHandler } from "./handlers/PRReviewHandler";
import * as core from '@actions/core';
(async () => {
  try {
    core.info('Running Review Raccoon...');    
    const handler = new PRReviewHandler();
    await handler.process();
  } catch (error: any) {
    core.error('An error occurred:', error);
    core.setFailed('Action failed with error');
    process.exit(1);
  }
})()