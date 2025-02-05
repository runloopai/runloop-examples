import os
from openai import OpenAI
from runloop_api_client import Runloop

# Initialize clients
openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
runloop = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

def generate_maze_creator():
    prompt = """Write a Python script that generates a maze. The script should:
    1. Accept a size parameter from command line arguments
    2. Generate a random maze of the specified size. Remember to make the maze solvable and easy and to make it clear the outer borders of the maze.
    3. Print the maze where '#' represents walls and ' ' represents paths. Mark the Maze start with 'S' and end with 'E'
    4. Use argparse for command line argument parsing
    Please provide complete, working code.
    The code should be in the format of a Python script that can be run directly with 'python gen_maze.py --size 5'.
    ONLY output the code and do NOT wrap the code in markdown! The code should begin with an import and end with a print statement."""

    try:
        # Generate code using OpenAI
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        maze_generation_script = response.choices[0].message.content

        # Execute the script in a Devbox
        devbox = runloop.devboxes.create_and_await_running()
        print("Devbox ID:", devbox.id)

        runloop.devboxes.write_file_contents(devbox.id,
         file_path= "gen_maze.py",
         contents= maze_generation_script
         )

        result = runloop.devboxes.execute_sync(devbox.id,
            command= "python gen_maze.py --size 10"
        )

        if not result.exit_status:
            print("Maze generated successfully\n", result.stdout)
        else:
            print("Script execution failed:", result.stderr)

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    generate_maze_creator()