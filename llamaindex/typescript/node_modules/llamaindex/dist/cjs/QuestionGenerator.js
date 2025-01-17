"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LLMQuestionGenerator", {
    enumerable: true,
    get: function() {
        return LLMQuestionGenerator;
    }
});
const _prompts = require("@llamaindex/core/prompts");
const _utils = require("@llamaindex/core/utils");
const _openai = require("@llamaindex/openai");
const _OutputParser = require("./OutputParser.js");
class LLMQuestionGenerator extends _prompts.PromptMixin {
    llm;
    prompt;
    outputParser;
    constructor(init){
        super();
        this.llm = init?.llm ?? new _openai.OpenAI();
        this.prompt = init?.prompt ?? _prompts.defaultSubQuestionPrompt;
        this.outputParser = init?.outputParser ?? new _OutputParser.SubQuestionOutputParser();
    }
    _getPrompts() {
        return {
            subQuestion: this.prompt
        };
    }
    _updatePrompts(promptsDict) {
        if ("subQuestion" in promptsDict) {
            this.prompt = promptsDict.subQuestion;
        }
    }
    async generate(tools, query) {
        const toolsStr = (0, _utils.toToolDescriptions)(tools);
        const queryStr = (0, _utils.extractText)(query);
        const prediction = (await this.llm.complete({
            prompt: this.prompt.format({
                toolsStr,
                queryStr
            })
        })).text;
        const structuredOutput = this.outputParser.parse(prediction);
        return structuredOutput.parsedOutput;
    }
    _getPromptModules() {
        return {};
    }
}
