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
    LLMMultiSelector: function() {
        return LLMMultiSelector;
    },
    LLMSingleSelector: function() {
        return LLMSingleSelector;
    }
});
const _utils = require("@llamaindex/core/utils");
const _selectors = require("../outputParsers/selectors.js");
const _base = require("./base.js");
const _prompts = require("./prompts.js");
function buildChoicesText(choices) {
    const texts = [];
    for (const [ind, choice] of choices.entries()){
        let text = choice.description.split("\n").join(" ");
        text = `(${ind + 1}) ${text}`; // to one indexing
        texts.push(text);
    }
    return texts.join("");
}
function structuredOutputToSelectorResult(output) {
    const structuredOutput = output;
    const answers = structuredOutput.parsedOutput;
    // adjust for zero indexing
    const selections = answers.map((answer)=>{
        return {
            index: answer.choice - 1,
            reason: answer.reason
        };
    });
    return {
        selections
    };
}
class LLMMultiSelector extends _base.BaseSelector {
    llm;
    prompt;
    maxOutputs;
    outputParser;
    constructor(init){
        super();
        this.llm = init.llm;
        this.prompt = init.prompt ?? _prompts.defaultMultiSelectPrompt;
        this.maxOutputs = init.maxOutputs ?? 10;
        this.outputParser = init.outputParser ?? new _selectors.SelectionOutputParser();
    }
    _getPrompts() {
        return {
            prompt: this.prompt
        };
    }
    _updatePrompts(prompts) {
        if ("prompt" in prompts) {
            this.prompt = prompts.prompt;
        }
    }
    _getPromptModules() {
        throw new Error("Method not implemented.");
    }
    /**
   * Selects a single choice from a list of choices.
   * @param choices
   * @param query
   */ async _select(choices, query) {
        const choicesText = buildChoicesText(choices);
        const prompt = this.prompt.format({
            contextList: choicesText,
            query: (0, _utils.extractText)(query.query),
            maxOutputs: `${this.maxOutputs}`,
            numChoices: `${choicesText.length}`
        });
        const formattedPrompt = this.outputParser?.format(prompt);
        const prediction = await this.llm.complete({
            prompt: formattedPrompt
        });
        const parsed = this.outputParser?.parse(prediction.text);
        if (!parsed) {
            throw new Error("Parsed output is undefined");
        }
        return structuredOutputToSelectorResult(parsed);
    }
    asQueryComponent() {
        throw new Error("Method not implemented.");
    }
}
class LLMSingleSelector extends _base.BaseSelector {
    llm;
    prompt;
    outputParser;
    constructor(init){
        super();
        this.llm = init.llm;
        this.prompt = init.prompt ?? _prompts.defaultSingleSelectPrompt;
        this.outputParser = init.outputParser ?? new _selectors.SelectionOutputParser();
    }
    _getPrompts() {
        return {
            prompt: this.prompt
        };
    }
    _updatePrompts(prompts) {
        if ("prompt" in prompts) {
            this.prompt = prompts.prompt;
        }
    }
    /**
   * Selects a single choice from a list of choices.
   * @param choices
   * @param query
   */ async _select(choices, query) {
        const choicesText = buildChoicesText(choices);
        const prompt = this.prompt.format({
            numChoices: `${choicesText.length}`,
            context: choicesText,
            query: (0, _utils.extractText)(query)
        });
        const formattedPrompt = this.outputParser.format(prompt);
        const prediction = await this.llm.complete({
            prompt: formattedPrompt
        });
        const parsed = this.outputParser?.parse(prediction.text);
        if (!parsed) {
            throw new Error("Parsed output is undefined");
        }
        return structuredOutputToSelectorResult(parsed);
    }
    asQueryComponent() {
        throw new Error("Method not implemented.");
    }
    _getPromptModules() {
        return {};
    }
}
