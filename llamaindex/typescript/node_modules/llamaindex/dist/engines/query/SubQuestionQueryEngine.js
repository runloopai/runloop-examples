import { getResponseSynthesizer } from "@llamaindex/core/response-synthesizers";
import { TextNode } from "@llamaindex/core/schema";
import { LLMQuestionGenerator } from "../../QuestionGenerator.js";
import { BaseQueryEngine } from "@llamaindex/core/query-engine";
/**
 * SubQuestionQueryEngine decomposes a question into subquestions and then
 */ export class SubQuestionQueryEngine extends BaseQueryEngine {
    responseSynthesizer;
    questionGen;
    queryEngines;
    metadatas;
    constructor(init){
        super();
        this.questionGen = init.questionGen;
        this.responseSynthesizer = init.responseSynthesizer ?? getResponseSynthesizer("compact");
        this.queryEngines = init.queryEngineTools;
        this.metadatas = init.queryEngineTools.map((tool)=>tool.metadata);
    }
    async _query(strOrQueryBundle, stream) {
        let query;
        if (typeof strOrQueryBundle === "string") {
            query = {
                query: strOrQueryBundle
            };
        } else {
            query = strOrQueryBundle;
        }
        const subQuestions = await this.questionGen.generate(this.metadatas, strOrQueryBundle);
        const subQNodes = await Promise.all(subQuestions.map((subQ)=>this.querySubQ(subQ)));
        const nodesWithScore = subQNodes.filter((node)=>node !== null);
        if (stream) {
            return this.responseSynthesizer.synthesize({
                query,
                nodes: nodesWithScore
            }, true);
        }
        return this.responseSynthesizer.synthesize({
            query,
            nodes: nodesWithScore
        }, false);
    }
    _getPrompts() {
        return {};
    }
    _updatePrompts() {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _getPromptModules() {
        return {
            questionGen: this.questionGen,
            responseSynthesizer: this.responseSynthesizer
        };
    }
    static fromDefaults(init) {
        const questionGen = init.questionGen ?? new LLMQuestionGenerator();
        const responseSynthesizer = init.responseSynthesizer ?? getResponseSynthesizer("compact");
        return new SubQuestionQueryEngine({
            questionGen,
            responseSynthesizer,
            queryEngineTools: init.queryEngineTools
        });
    }
    async querySubQ(subQ) {
        try {
            const question = subQ.subQuestion;
            const queryEngine = this.queryEngines.find((tool)=>tool.metadata.name === subQ.toolName);
            if (!queryEngine) {
                return null;
            }
            const responseValue = await queryEngine?.call?.({
                query: question
            });
            if (responseValue == null) {
                return null;
            }
            const nodeText = `Sub question: ${question}\nResponse: ${typeof responseValue === "string" ? responseValue : JSON.stringify(responseValue)}`;
            const node = new TextNode({
                text: nodeText
            });
            return {
                node,
                score: 0
            };
        } catch (error) {
            return null;
        }
    }
}
