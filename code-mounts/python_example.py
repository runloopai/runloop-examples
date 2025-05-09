"""
Example of using Runloop code mounts in Python.

This example demonstrates how to:
1. Create a devbox with code mounts
2. Configure GitHub authentication
3. Work with private repositories
"""

import os
import requests
from typing import Dict, List, Optional

class RunloopDevbox:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.runloop.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def create_devbox_with_code_mount(
        self,
        repo_name: str,
        repo_owner: str,
        github_token: str,
        additional_mounts: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Create a devbox with code mounts for a specific repository.
        
        Args:
            repo_name: Name of the repository
            repo_owner: Owner of the repository
            github_token: GitHub personal access token
            additional_mounts: Optional list of additional code mounts
            
        Returns:
            Dict containing the devbox creation response
        """
        code_mounts = [
            {
                "repo_name": repo_name,
                "repo_owner": repo_owner,
                "token": github_token
            }
        ]
        
        if additional_mounts:
            code_mounts.extend(additional_mounts)

        payload = {
            "code_mounts": code_mounts
        }

        response = requests.post(
            f"{self.base_url}/devboxes",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def create_devbox_with_manual_github_config(
        self,
        github_token: str,
        cache_timeout: int = 3600
    ) -> Dict:
        """
        Create a devbox with manual GitHub configuration.
        
        Args:
            github_token: GitHub personal access token
            cache_timeout: Timeout for git credential cache in seconds
            
        Returns:
            Dict containing the devbox creation response
        """
        payload = {
            "environment_variables": {"GH_TOKEN": github_token},
            "setup_commands": [
                f"git config --global credential.helper 'cache --timeout={cache_timeout}'",
                "echo \"protocol=https\nhost=github.com\nusername=$GH_TOKEN\npassword=$GH_TOKEN\" | git credential-cache store"
            ]
        }

        response = requests.post(
            f"{self.base_url}/devboxes",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

# Example usage
if __name__ == "__main__":
    # Initialize the Runloop client
    runloop = RunloopDevbox(api_key=os.getenv("RUNLOOP_API_KEY"))

    # Example 1: Create a devbox with a single code mount
    devbox = runloop.create_devbox_with_code_mount(
        repo_name="example-repo",
        repo_owner="example-org",
        github_token=os.getenv("GITHUB_TOKEN")
    )
    print("Created devbox with code mount:", devbox)

    # Example 2: Create a devbox with manual GitHub configuration
    devbox = runloop.create_devbox_with_manual_github_config(
        github_token=os.getenv("GITHUB_TOKEN")
    )
    print("Created devbox with manual GitHub config:", devbox) 