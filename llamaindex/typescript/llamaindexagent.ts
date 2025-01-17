import { 
    OpenAI, 
    FunctionTool, 
    OpenAIAgent,
    Settings
} from "llamaindex"
import Runloop from '@runloop/api-client';

// Initialize Runloop client
const runloop = new Runloop({ bearerToken: process.env.RUNLOOP_API_KEY });

// Create a new Devbox and wait for it to be running
async function createAndAwaitRunning() {
    const devbox = await runloop.devboxes.create();
    while (true) {
        const status = await runloop.devboxes.retrieve(devbox.id);
        if (status.status === 'running') {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return devbox;
}

// Create an OpenAI agent to generate Python code and run it in a Runloop Devbox
async function openAiAgent() {

    try{
        Settings.llm = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: "gpt-4-turbo",
        })

        // Define a function tool
        const sumNumbers = ({a, b}: {a: number, b: number}) => {
            return `${a + b}`;
        }

        // Create a tool from the function
        const tool = FunctionTool.from(
            sumNumbers,
            {
                name: "sumNumbers",
                description: "Use this function to sum two numbers",
                parameters: {
                    type: "object",
                    properties: {
                        a: {
                            type: "number",
                            description: "First number to sum"
                        },
                        b: {
                            type: "number",
                            description: "Second number to sum"
                        },
                    },
                    required: ["a", "b"]
                }
            }
        )

        const tools = [tool]

        // Create an OpenAI agent with the tools
        const agent = new OpenAIAgent({tools})
        let response = await agent.chat({
            message: "Write a Python script that adds two randomly generated numbers. The script should:\n" +
                            "1. Generate random numbers. Both numbers should be less than 10000.\n" +
                            "2. Print the numbers that are being added and the final result.'\n" +
                            "Please provide complete, working code." + 
                            "The code should be in the format of a Python script that can be run directly with 'python agent.py'.\n" +
                            "ONLY output the code and do NOT wrap the code in markdown! \n This means the output should not begin with ```python or end with ```\n",
        })
        
        const content = response.message.content as string;

        // Create a new Devbox so we can securely run our AI generated code
        const devbox = await createAndAwaitRunning()
        console.log("Devbox ID:", devbox.id);

        // Write the generated code to a file in the Devbox
        await runloop.devboxes.writeFileContents(devbox.id, {
            file_path: "agent.py",
            contents: content
        });

        // Execute the code in the Dev
        const result = await runloop.devboxes.executeSync(devbox.id, {
            command: "python agent.py"
        });

        // Check the result of the code execution
        if (result.exit_status === 0) {
            console.log(result.stdout)
        } else {
            console.log(result.stderr)
        }
    } catch (error) {
        console.error("An error occurred: ", error)
    }
}

openAiAgent();
