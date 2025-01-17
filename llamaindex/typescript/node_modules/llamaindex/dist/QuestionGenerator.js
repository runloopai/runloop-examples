import { defaultSubQuestionPrompt, PromptMixin } from "@llamaindex/core/prompts";
import { extractText, toToolDescriptions } from "@llamaindex/core/utils";
import { OpenAI } from "@llamaindex/openai";
import { SubQuestionOutputParser } from "./OutputParser.js";
/**
 * LLMQuestionGenerator uses the LLM to generate new questions for the LLM using tools and a user query.
 */ export class LLMQuestionGenerator extends PromptMixin {
    llm;
    prompt;
    outputParser;
    constructor(init){
        super();
        this.llm = init?.llm ?? new OpenAI();
        this.prompt = init?.prompt ?? defaultSubQuestionPrompt;
        this.outputParser = init?.outputParser ?? new SubQuestionOutputParser();
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
        const toolsStr = toToolDescriptions(tools);
        const queryStr = extractText(query);
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
