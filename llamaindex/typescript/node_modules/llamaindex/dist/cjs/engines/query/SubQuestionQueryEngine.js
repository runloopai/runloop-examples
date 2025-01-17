"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SubQuestionQueryEngine", {
    enumerable: true,
    get: function() {
        return SubQuestionQueryEngine;
    }
});
const _responsesynthesizers = require("@llamaindex/core/response-synthesizers");
const _schema = require("@llamaindex/core/schema");
const _QuestionGenerator = require("../../QuestionGenerator.js");
const _queryengine = require("@llamaindex/core/query-engine");
class SubQuestionQueryEngine extends _queryengine.BaseQueryEngine {
    responseSynthesizer;
    questionGen;
    queryEngines;
    metadatas;
    constructor(init){
        super();
        this.questionGen = init.questionGen;
        this.responseSynthesizer = init.responseSynthesizer ?? (0, _responsesynthesizers.getResponseSynthesizer)("compact");
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
        const questionGen = init.questionGen ?? new _QuestionGenerator.LLMQuestionGenerator();
        const responseSynthesizer = init.responseSynthesizer ?? (0, _responsesynthesizers.getResponseSynthesizer)("compact");
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
            const node = new _schema.TextNode({
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
