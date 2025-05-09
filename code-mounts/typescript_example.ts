/**
 * Example of using Runloop code mounts in TypeScript.
 *
 * This example demonstrates how to:
 * 1. Create a devbox with code mounts
 * 2. Configure GitHub authentication
 * 3. Work with private repositories
 */

import fetch from "node-fetch";

interface CodeMount {
  repo_name: string;
  repo_owner: string;
  token: string;
}

interface DevboxConfig {
  code_mounts?: CodeMount[];
  environment_variables?: Record<string, string>;
  setup_commands?: string[];
}

class RunloopDevbox {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.runloop.ai/v1";
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Create a devbox with code mounts for a specific repository.
   *
   * @param repoName - Name of the repository
   * @param repoOwner - Owner of the repository
   * @param githubToken - GitHub personal access token
   * @param additionalMounts - Optional array of additional code mounts
   * @returns Promise containing the devbox creation response
   */
  async createDevboxWithCodeMount(
    repoName: string,
    repoOwner: string,
    githubToken: string,
    additionalMounts?: CodeMount[]
  ): Promise<any> {
    const codeMounts: CodeMount[] = [
      {
        repo_name: repoName,
        repo_owner: repoOwner,
        token: githubToken,
      },
    ];

    if (additionalMounts) {
      codeMounts.push(...additionalMounts);
    }

    const payload: DevboxConfig = {
      code_mounts: codeMounts,
    };

    const response = await fetch(`${this.baseUrl}/devboxes`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create devbox: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a devbox with manual GitHub configuration.
   *
   * @param githubToken - GitHub personal access token
   * @param cacheTimeout - Timeout for git credential cache in seconds
   * @returns Promise containing the devbox creation response
   */
  async createDevboxWithManualGithubConfig(
    githubToken: string,
    cacheTimeout: number = 3600
  ): Promise<any> {
    const payload: DevboxConfig = {
      environment_variables: {
        GH_TOKEN: githubToken,
      },
      setup_commands: [
        `git config --global credential.helper 'cache --timeout=${cacheTimeout}'`,
        'echo "protocol=https\nhost=github.com\nusername=$GH_TOKEN\npassword=$GH_TOKEN" | git credential-cache store',
      ],
    };

    const response = await fetch(`${this.baseUrl}/devboxes`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create devbox: ${response.statusText}`);
    }

    return response.json();
  }
}

// Example usage
async function main() {
  // Initialize the Runloop client
  const runloop = new RunloopDevbox(process.env.RUNLOOP_API_KEY || "");

  try {
    // Example 1: Create a devbox with a single code mount
    const devbox1 = await runloop.createDevboxWithCodeMount(
      "example-repo",
      "example-org",
      process.env.GITHUB_TOKEN || ""
    );
    console.log("Created devbox with code mount:", devbox1);

    // Example 2: Create a devbox with manual GitHub configuration
    const devbox2 = await runloop.createDevboxWithManualGithubConfig(
      process.env.GITHUB_TOKEN || ""
    );
    console.log("Created devbox with manual GitHub config:", devbox2);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}
