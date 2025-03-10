# AI Code Reviewer

AI-powered code review tool for GitHub pull requests.

## Project Structure


```
src/
├── index.ts               # Entry point
├── types/
│   └── index.ts           # Common interfaces and types
├── config/
│   └── index.ts           # Configuration and environment variables
├── services/
│   ├── GitHubService.ts   # GitHub API interactions
│   └── AIService.ts       # OpenAI API interactions
├── utils/
│   └── diffUtils.ts       # Utilities for diff processing
└── handlers/
    └── PRReviewHandler.ts # Main PR review logic
```

## Components

### Services

- **GitHubService**: Handles all GitHub API interactions, including fetching PR details, diffs, and posting comments.
- **AIService**: Manages interactions with the OpenAI API to generate code review comments.

### Utils

- **DiffUtils**: Provides utility functions for processing diffs, creating prompts for AI, and formatting comments.

### Handlers

- **PRReviewHandler**: Orchestrates the entire review process.

## Setup and Running

1. Install dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Package the project:
   ```
   npm run package
   ```

## Configuration

The tool uses GitHub Action inputs for configuration. The following inputs are available:

- `GITHUB_TOKEN`: GitHub token for API access
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_API_MODEL`: OpenAI model to use
- `exclude`: Comma-separated list of patterns to exclude from review

## Features

- Reviews pull requests using OpenAI's GPT-4 API.
- Provides intelligent comments and suggestions for improving your code.
- Filters out files that match specified exclude patterns.
- Easy to set up and integrate into your GitHub workflow.

## Setup

1. To use this GitHub Action, you need an OpenAI API key. If you don't have one, sign up for an API key
   at [OpenAI](https://beta.openai.com/signup).

2. Add the OpenAI API key as a GitHub Secret in your repository with the name `OPENAI_API_KEY`. You can find more
   information about GitHub Secrets [here](https://docs.github.com/en/actions/reference/encrypted-secrets).

3. Create a `.github/workflows/main.yml` file in your repository and add the following content:

```yaml
name: AI Code Reviewer

on:
  pull_request:
    types:
      - opened
      - synchronize
permissions: write-all
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v3

      - name: AI Code Reviewer
        uses: your-username/ai-code-reviewer@main
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # The GITHUB_TOKEN is there by default so you just need to keep it like it is and not necessarily need to add it as secret as it will throw an error. [More Details](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret)
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          OPENAI_API_MODEL: "gpt-4" # Optional: defaults to "gpt-4"
          exclude: "**/*.json, **/*.md" # Optional: exclude patterns separated by commas
```

4. Replace `your-username` with your GitHub username or organization name where the AI Code Reviewer repository is
   located.

5. Customize the `exclude` input if you want to ignore certain file patterns from being reviewed.

6. Commit the changes to your repository, and AI Code Reviewer will start working on your future pull requests.

## How It Works

The AI Code Reviewer GitHub Action retrieves the pull request diff, filters out excluded files, and sends code chunks to
the OpenAI API. It then generates review comments based on the AI's response and adds them to the pull request.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the AI Code Reviewer GitHub
Action.

Let the maintainer generate the final package (`yarn build` & `yarn package`).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
