import os

@staticmethod
def update_env_file(env_vars, env_file=".env"):
    """
        This function reads the existing .env file, updates it with the provided
        environment variables, and writes the updated content back to the .env file.

        Args:
            env_vars (dict): A dictionary containing the environment variables to update.
            env_file (str, optional): The path to the .env file. Defaults to ".env".

        Example:
            update_env_file({"API_KEY": "new_key", "DEBUG": "true"}, env_file=".env")

        Raises:
            IOError: If there is an error reading or writing the .env file.
    """
    env_data = {}

    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    env_data[key] = value

    env_data.update(env_vars)

    with open(env_file, "w") as f:
        for key, value in env_data.items():
            f.write(f"{key}={value}\n")

