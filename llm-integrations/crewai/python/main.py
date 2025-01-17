from crewai.tools import tool
from crewai import Agent, Task, Crew, LLM
from runloop_api_client import Runloop
import os


@tool("Tool to generate Python code using LLM")
def generate_code(prompt: str) -> str:
    """
    Generate Python code based on a given prompt using the LLM.
    """
    try:
        # Generate code using the LLM
        llm = LLM(model="gpt-4o")
        response = llm.chat(messages=[{"role": "user", "content": prompt}])
        generated_code = response["choices"][0]["message"]["content"]

        return generated_code

    except Exception as e:
        print("LLM Exception occurred:", e)
        return str(e)


@tool("Tool to execute Python code on Runloop")
def execute_code_on_runloop(code: str, size: int):
    """
    Execute Python code on a Runloop Devbox.
    """
    try:
        # Initialize client
        runloop = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

        # Execute the script in a Devbox
        devbox = runloop.devboxes.create_and_await_running()
        print("Devbox ID:", devbox.id)

        runloop.devboxes.write_file_contents(
            devbox.id, file_path="gen_maze.py", contents=code
        )

        result = runloop.devboxes.execute_sync(
            devbox.id, command=f"python gen_maze.py --size {size}"
        )

        if not result.exit_status:
            print("Maze generated successfully\n", result.stdout)
            return result.stdout
        else:
            print("Script execution failed:", result.stderr)
            return result.stderr

    except Exception as e:
        print("Runloop Exception occurred:", e)
        return str(e)


# Define the agent
code_writer_executor = Agent(
    role="Python Code Writer and Executor",
    goal="Write Python scripts based on prompts, execute them, and return the results.",
    backstory="You are an expert Python programmer capable of writing, executing code, and returning results.",
    tools=[generate_code, execute_code_on_runloop],
    llm=LLM(model="gpt-4o"),
)

# Define the task
generate_maze_task = Task(
    description="Generate and execute a Python script that creates a maze.",
    agent=code_writer_executor,
    expected_output="A successfully generated and executed maze of size 11.",
    inputs={
        "prompt": """Write a Python script that generates a maze. The script should:
        1. Accept a size parameter from command line arguments.
        2. Generate a random maze of the specified size. Ensure the maze is solvable.
        3. Print the maze using '+' for walls and spaces for paths. Mark the Maze start with 'S' and end with 'E'.
        4. Use argparse for command line argument parsing.
        Please provide complete, working code. The code should be in the format of a Python script that can be run directly with 'python gen_maze.py --size 5'.
        ONLY output the code and DO NOT wrap it in markdown! The code should begin with an import and end with a print statement. Do not include a shebang line.
        Do not include the word python in the code.""",
        "size": 11,
    },
)

# Create the crew
maze_generation_crew = Crew(
    agents=[code_writer_executor],
    tasks=[generate_maze_task],
    verbose=True,
)

# Run the crew
result = maze_generation_crew.kickoff()
print(result)
