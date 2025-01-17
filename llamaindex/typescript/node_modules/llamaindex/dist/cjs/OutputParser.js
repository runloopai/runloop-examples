"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    SubQuestionOutputParser: function() {
        return SubQuestionOutputParser;
    },
    parseJsonMarkdown: function() {
        return parseJsonMarkdown;
    }
});
/**
 * Error class for output parsing. Due to the nature of LLMs, anytime we use LLM
 * to generate structured output, it's possible that it will hallucinate something
 * that doesn't match the expected output format. So make sure to catch these
 * errors in production.
 */ class OutputParserError extends Error {
    cause;
    output;
    constructor(message, options = {}){
        super(message, options); // https://github.com/tc39/proposal-error-cause
        this.name = "OutputParserError";
        if (!this.cause) {
            // Need to check for those environments that have implemented the proposal
            this.cause = options.cause;
        }
        this.output = options.output;
        // This line is to maintain proper stack trace in V8
        // (https://v8.dev/docs/stack-trace-api)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, OutputParserError);
        }
    }
}
function parseJsonMarkdown(text) {
    text = text.trim();
    const left_square = text.indexOf("[");
    const left_brace = text.indexOf("{");
    let left;
    let right;
    if (left_square < left_brace && left_square != -1) {
        left = left_square;
        right = text.lastIndexOf("]");
    } else {
        left = left_brace;
        right = text.lastIndexOf("}");
    }
    const jsonText = text.substring(left, right + 1);
    try {
        //Single JSON object case
        if (left_square === -1) {
            return [
                JSON.parse(jsonText)
            ];
        }
        //Multiple JSON object case.
        return JSON.parse(jsonText);
    } catch (e) {
        throw new OutputParserError("Not a json markdown", {
            output: text
        });
    }
}
class SubQuestionOutputParser {
    parse(output) {
        const parsed = parseJsonMarkdown(output);
        return {
            rawOutput: output,
            parsedOutput: parsed
        };
    }
    format(output) {
        return output;
    }
}
