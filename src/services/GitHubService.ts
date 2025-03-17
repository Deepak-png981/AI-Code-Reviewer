import { readFileSync } from "fs";
import { Octokit } from "@octokit/rest";
import { PRDetails, ReviewComment } from "../types";
import { Config } from "../config";

export class GitHubService {
  private octokit: Octokit;
  private static instance: GitHubService;

  private constructor() {
    const config = Config.getInstance();
    this.octokit = new Octokit({ auth: config.GITHUB_TOKEN });
  }

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  public async getPRDetails(): Promise<PRDetails> {
    const eventData = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH || "", "utf8")
    );
    const { repository, number } = eventData;

    const prResponse = await this.octokit.pulls.get({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: number,
    });

    return {
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: number,
      title: prResponse.data.title ?? "",
      description: prResponse.data.body ?? "",
    };
  }

  public async getDiff(
    owner: string,
    repo: string,
    pull_number: number
  ): Promise<string | null> {
    const response = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: "diff" },
    });
    // @ts-expect-error - response.data is a string
    return response.data;
  }

  public async getCommitDiff(
    owner: string,
    repo: string,
    baseSha: string,
    headSha: string
  ): Promise<string> {
    const response = await this.octokit.repos.compareCommits({
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
      owner,
      repo,
      base: baseSha,
      head: headSha,
    });

    return String(response.data);
  }

  public async createReviewComment(
    owner: string,
    repo: string,
    pull_number: number,
    comments: ReviewComment[]
  ): Promise<void> {
    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      comments,
      event: "COMMENT",
    });
  }
  public async updatePRDescription(
    owner: string,
    repo: string,
    pull_number: number,
    description: string
  ): Promise<void> {
    await this.octokit.pulls.update({
      owner,
      repo,
      pull_number,
      body: description,
    });
  }
} 