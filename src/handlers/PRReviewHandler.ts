import * as core from "@actions/core";



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

      await this.updatePRDescription(prDetails);

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
      if (PRReviewHandler.isDeletedFile(file)) continue; // Skip deleted files

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

  private static isDeletedFile(file: File): boolean {
    return file.to === PRReviewHandler.DELETED_FILE_PATH;
  }

  private async updatePRDescription(
    prDetails: PRDetails
  ): Promise<void> {
    if (!this.config.UPDATE_PR_DESCRIPTION) {
      return;
    }

    const currentDescription = prDetails.description || "";

    if (currentDescription.includes("## PR Changes Summary")) {
      core.info("PR description has already been updated. Skipping update.");
      return;
    }
    
    try {

      const changedFiles = await this.gitHubService.getChangedFiles(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number
      );
      core.info(`changedFiles : ${JSON.stringify(changedFiles)}`);

      const changesSummary = this.generateChangesSummary(changedFiles);
      
      const newDescription = currentDescription 
        ? `${currentDescription}\n\n${changesSummary}`
        : changesSummary;
      
      // Update the PR description
      await this.gitHubService.updatePRDescription(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number,
        newDescription
      );
      
      core.info("Successfully updated PR description with changes summary.");
    } catch (error) {
      this.errorHandler.handleError(
        "Failed to update PR description",
        ErrorSeverity.WARNING,
        error as Error
      );
    }
  }

  private generateChangesSummary(changedFiles: any[]): string {
    let summary = `## PR Changes Summary\n\n`;
    
    // Count files by type
    const fileTypes: Record<string, number> = {};
    const filesByStatus: Record<string, number> = {
      added: 0,
      modified: 0,
      removed: 0,
      renamed: 0,
    };
    
    changedFiles.forEach(file => {
      // Count by file extension
      const extension = file.filename.split('.').pop() || 'unknown';
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
      
      // Count by status
      filesByStatus[file.status] = (filesByStatus[file.status] || 0) + 1;
    });
    
    // Add files changed section
    summary += `### Files Changed\n\n`;
    summary += `Total: ${changedFiles.length} files\n\n`;
    
    // Add status breakdown
    summary += `**Changes by status:**\n`;
    for (const [status, count] of Object.entries(filesByStatus)) {
      if (count > 0) {
        summary += `- ${status}: ${count} files\n`;
      }
    }
    summary += `\n`;
    
    // Add file type breakdown
    summary += `**Changes by file type:**\n`;
    for (const [type, count] of Object.entries(fileTypes)) {
      summary += `- .${type}: ${count} files\n`;
    }
    summary += `\n`;
    
    // Add list of changed files
    summary += `### Changed Files List\n\n`;
    changedFiles.forEach(file => {
      const changes = file.additions + file.deletions;
      summary += `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}, ${changes} changes)\n`;
    });
    
    summary += `\n*This summary was automatically generated on ${new Date().toISOString()}*\n`;
    
    return summary;
  }
} 