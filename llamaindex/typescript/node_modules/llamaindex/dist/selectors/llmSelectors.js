import { extractText } from "@llamaindex/core/utils";
import { SelectionOutputParser } from "../outputParsers/selectors.js";
import { BaseSelector } from "./base.js";
import { defaultMultiSelectPrompt, defaultSingleSelectPrompt } from "./prompts.js";
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
/**
 * A selector that uses the LLM to select a single or multiple choices from a list of choices.
 */ export class LLMMultiSelector extends BaseSelector {
    llm;
    prompt;
    maxOutputs;
    outputParser;
    constructor(init){
        super();
        this.llm = init.llm;
        this.prompt = init.prompt ?? defaultMultiSelectPrompt;
        this.maxOutputs = init.maxOutputs ?? 10;
        this.outputParser = init.outputParser ?? new SelectionOutputParser();
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
            query: extractText(query.query),
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
/**
 * A selector that uses the LLM to select a single choice from a list of choices.
 */ export class LLMSingleSelector extends BaseSelector {
    llm;
    prompt;
    outputParser;
    constructor(init){
        super();
        this.llm = init.llm;
        this.prompt = init.prompt ?? defaultSingleSelectPrompt;
        this.outputParser = init.outputParser ?? new SelectionOutputParser();
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
            query: extractText(query)
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
