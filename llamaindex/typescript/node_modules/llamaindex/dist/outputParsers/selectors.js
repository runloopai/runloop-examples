import { parseJsonMarkdown } from "../OutputParser.js";
const formatStr = `The output should be ONLY JSON formatted as a JSON instance.

Here is an example:
[
    {
        "choice": 1,
        "reason": "<insert reason for choice>"
    },
    ...
]
`;
/*
 * An OutputParser is used to extract structured data from the raw output of the LLM.
 */ export class SelectionOutputParser {
    /**
   *
   * @param output
   */ parse(output) {
        let parsed;
        try {
            parsed = parseJsonMarkdown(output);
        } catch (e) {
            try {
                parsed = JSON.parse(output);
            } catch (e) {
                throw new Error(`Got invalid JSON object. Error: ${e}. Got JSON string: ${output}`);
            }
        }
        return {
            rawOutput: output,
            parsedOutput: parsed
        };
    }
    format(output) {
        return output + "\n\n" + formatStr;
    }
}
