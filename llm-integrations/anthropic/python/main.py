from anthropic import Anthropic
from runloop_api_client import Runloop
import os

# Initialize clients
anthropic = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
runloop = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))


def generate_maze_creator():
    system_prompt = "You are a helpful coding assistant that can generate and execute python code. You only respond with the code to be executed and nothing else. Strip backticks in code blocks."
    prompt = """Write a Python script that generates a maze. The script should:
    1. Accept a size parameter from command line arguments
    2. Generate a random maze of the specified size. Remember to make the maze solvable and easy and to make it clear the outer borders of the maze.
    3. Print the maze where '#' represents walls and ' ' represents paths. Mark the Maze start with 'S' and end with 'E'
    4. Use argparse for command line argument parsing
    Please provide complete, working code.
    The code should be in the format of a Python script that can be run directly with 'python gen_maze.py --size 5'.
    ONLY output the code and do NOT wrap the code in markdown! The code should begin with an import and end with a print statement."""

    try:
        # Generate code using Claude
        response = anthropic.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1024,
            messages=[
                {"role": "assistant", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        )
        maze_generation_script = response.content[0].text

        # Execute the script in a Devbox
        devbox = runloop.devboxes.create_and_await_running()
        print("Devbox ID:", devbox.id)

        runloop.devboxes.write_file_contents(
            devbox.id, file_path="gen_maze.py", contents=maze_generation_script
        )

        result = runloop.devboxes.execute_sync(
            devbox.id, command="python gen_maze.py --size 10"
        )

        if not result.exit_status:
            print("Maze generated successfully\n", result.stdout)
        else:
            print("Script execution failed:", result.stderr)

    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    generate_maze_creator()
