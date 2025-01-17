"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SelectionOutputParser", {
    enumerable: true,
    get: function() {
        return SelectionOutputParser;
    }
});
const _OutputParser = require("../OutputParser.js");
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
class SelectionOutputParser {
    /**
   *
   * @param output
   */ parse(output) {
        let parsed;
        try {
            parsed = (0, _OutputParser.parseJsonMarkdown)(output);
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
