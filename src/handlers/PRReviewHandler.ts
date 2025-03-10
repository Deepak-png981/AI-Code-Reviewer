import { readFileSync } from "fs";
import { File } from "parse-diff";
import { PRDetails, ReviewComment } from "../types";
import { Config } from "../config";
import { GitHubService } from "../services/GitHubService";
import { AIService } from "../services/AIService";
import { DiffUtils } from "../utils/diffUtils";
import { ErrorHandler } from "./error";
import { ErrorSeverity } from "../types";

export class PRReviewHandler {
  private gitHubService: GitHubService;
  private aiService: AIService;
  private config: Config;
  private errorHandler: ErrorHandler;
  private static readonly DELETED_FILE_PATH = "/dev/null";

  constructor() {
    this.gitHubService = GitHubService.getInstance();
    this.aiService = AIService.getInstance();
    this.config = Config.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  public async process(): Promise<void> {
    try {
      const prDetails = await this.gitHubService.getPRDetails();
      const diff = await this.getDiffBasedOnEvent(prDetails);

      if (!diff) {
        this.errorHandler.handleError(
          "No diff found for the current PR event. Unable to proceed with code review.",
          ErrorSeverity.WARNING
        );
        return;
      }

      const parsedDiff = DiffUtils.parseDiff(diff);

      const filteredDiff = DiffUtils.filterDiff(
        parsedDiff,
        this.config.EXCLUDE_PATTERNS
      );

      const comments = await this.analyzeCode(filteredDiff, prDetails);

      if (comments.length > 0) {
        await this.gitHubService.createReviewComment(
          prDetails.owner,
          prDetails.repo,
          prDetails.pull_number,
          comments
        );
      }
    } catch (error) {
      this.errorHandler.handleError("Error in PR review process", ErrorSeverity.ERROR, error as Error);
      throw error;
    }
  }

  private async getDiffBasedOnEvent(prDetails: PRDetails): Promise<string | null> {
    const eventData = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8")
    );

    if (eventData.action === "opened") {
      return await this.gitHubService.getDiff(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number
      );
    } else if (eventData.action === "synchronize") {
      const newBaseSha = eventData.before;
      const newHeadSha = eventData.after;

      return await this.gitHubService.getCommitDiff(
        prDetails.owner,
        prDetails.repo,
        newBaseSha,
        newHeadSha
      );
    } else {
      console.log("Unsupported event:", process.env.GITHUB_EVENT_NAME);
      return null;
    }
  }

  private async analyzeCode(
    parsedDiff: File[],
    prDetails: PRDetails
  ): Promise<ReviewComment[]> {
    const comments: ReviewComment[] = [];

    for (const file of parsedDiff) {
      if (this.isDeletedFile(file)) continue; // Skip deleted files

      for (const chunk of file.chunks) {
        const prompt = DiffUtils.createPrompt(file, chunk, prDetails);
        const aiResponses = await this.aiService.getReviewComments(prompt);

        if (aiResponses) {
          const newComments = DiffUtils.createReviewComments(file, chunk, aiResponses);
          comments.push(...newComments);
        }
      }
    }

    return comments;
  }

  private isDeletedFile(file: File): boolean {
    return file.to === PRReviewHandler.DELETED_FILE_PATH;
  }
} 