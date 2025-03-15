import { PRReviewHandler } from "./handlers/PRReviewHandler";
const core = require('@actions/core');

(async () => {
  try {
    const handler = new PRReviewHandler();
    core.info('This is an informational message');
    core.warning('This is a warning message');
    core.error('This is an error message');
    core.debug('This is a debug message');
    core.setOutput('result', 'some value');
    
    await handler.process();
  } catch (error) {
    console.error("Error occurred during PR review process:", error);
    core.setFailed('Action failed with error');
    process.exit(1);
  }
})()