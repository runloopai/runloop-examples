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
    KeywordExtractor: function() {
        return KeywordExtractor;
    },
    QuestionsAnsweredExtractor: function() {
        return QuestionsAnsweredExtractor;
    },
    SummaryExtractor: function() {
        return SummaryExtractor;
    },
    TitleExtractor: function() {
        return TitleExtractor;
    }
});
const _prompts = require("@llamaindex/core/prompts");
const _schema = require("@llamaindex/core/schema");
const _openai = require("@llamaindex/openai");
const _types = require("./types.js");
const STRIP_REGEX = /(\r\n|\n|\r)/gm;
class KeywordExtractor extends _types.BaseExtractor {
    /**
   * LLM instance.
   * @type {LLM}
   */ llm;
    /**
   * Number of keywords to extract.
   * @type {number}
   * @default 5
   */ keywords = 5;
    /**
   * The prompt template to use for the question extractor.
   * @type {string}
   */ promptTemplate;
    /**
   * Constructor for the KeywordExtractor class.
   * @param {LLM} llm LLM instance.
   * @param {number} keywords Number of keywords to extract.
   * @throws {Error} If keywords is less than 1.
   */ constructor(options){
        if (options?.keywords && options.keywords < 1) throw new Error("Keywords must be greater than 0");
        super();
        this.llm = options?.llm ?? new _openai.OpenAI();
        this.keywords = options?.keywords ?? 5;
        this.promptTemplate = options?.promptTemplate ? new _prompts.PromptTemplate({
            templateVars: [
                "context",
                "maxKeywords"
            ],
            template: options.promptTemplate
        }) : _prompts.defaultKeywordExtractPrompt;
    }
    /**
   *
   * @param node Node to extract keywords from.
   * @returns Keywords extracted from the node.
   */ async extractKeywordsFromNodes(node) {
        if (this.isTextNodeOnly && !(node instanceof _schema.TextNode)) {
            return {};
        }
        const completion = await this.llm.complete({
            prompt: this.promptTemplate.format({
                context: node.getContent(_schema.MetadataMode.ALL),
                maxKeywords: this.keywords.toString()
            })
        });
        return {
            excerptKeywords: completion.text
        };
    }
    /**
   *
   * @param nodes Nodes to extract keywords from.
   * @returns Keywords extracted from the nodes.
   */ async extract(nodes) {
        const results = await Promise.all(nodes.map((node)=>this.extractKeywordsFromNodes(node)));
        return results;
    }
}
class TitleExtractor extends _types.BaseExtractor {
    /**
   * LLM instance.
   * @type {LLM}
   */ llm;
    /**
   * Can work for mixture of text and non-text nodes
   * @type {boolean}
   * @default false
   */ isTextNodeOnly = false;
    /**
   * Number of nodes to extrct titles from.
   * @type {number}
   * @default 5
   */ nodes = 5;
    /**
   * The prompt template to use for the title extractor.
   * @type {string}
   */ nodeTemplate;
    /**
   * The prompt template to merge title with..
   * @type {string}
   */ combineTemplate;
    /**
   * Constructor for the TitleExtractor class.
   * @param {LLM} llm LLM instance.
   * @param {number} nodes Number of nodes to extract titles from.
   * @param {TitleExtractorPrompt} nodeTemplate The prompt template to use for the title extractor.
   * @param {string} combineTemplate The prompt template to merge title with..
   */ constructor(options){
        super();
        this.llm = options?.llm ?? new _openai.OpenAI();
        this.nodes = options?.nodes ?? 5;
        this.nodeTemplate = options?.nodeTemplate ? new _prompts.PromptTemplate({
            templateVars: [
                "context"
            ],
            template: options.nodeTemplate
        }) : _prompts.defaultTitleExtractorPromptTemplate;
        this.combineTemplate = options?.combineTemplate ? new _prompts.PromptTemplate({
            templateVars: [
                "context"
            ],
            template: options.combineTemplate
        }) : _prompts.defaultTitleCombinePromptTemplate;
    }
    /**
   * Extract titles from a list of nodes.
   * @param {BaseNode[]} nodes Nodes to extract titles from.
   * @returns {Promise<BaseNode<ExtractTitle>[]>} Titles extracted from the nodes.
   */ async extract(nodes) {
        const nodesToExtractTitle = this.filterNodes(nodes);
        if (!nodesToExtractTitle.length) {
            return [];
        }
        const nodesByDocument = this.separateNodesByDocument(nodesToExtractTitle);
        const titlesByDocument = await this.extractTitles(nodesByDocument);
        return nodesToExtractTitle.map((node)=>{
            return {
                documentTitle: titlesByDocument[node.sourceNode?.nodeId ?? ""]
            };
        });
    }
    filterNodes(nodes) {
        return nodes.filter((node)=>{
            if (this.isTextNodeOnly && !(node instanceof _schema.TextNode)) {
                return false;
            }
            return true;
        });
    }
    separateNodesByDocument(nodes) {
        const nodesByDocument = {};
        for (const node of nodes){
            const parentNode = node.sourceNode?.nodeId;
            if (!parentNode) {
                continue;
            }
            if (!nodesByDocument[parentNode]) {
                nodesByDocument[parentNode] = [];
            }
            nodesByDocument[parentNode].push(node);
        }
        return nodesByDocument;
    }
    async extractTitles(nodesByDocument) {
        const titlesByDocument = {};
        for (const [key, nodes] of Object.entries(nodesByDocument)){
            const titleCandidates = await this.getTitlesCandidates(nodes);
            const combinedTitles = titleCandidates.join(", ");
            const completion = await this.llm.complete({
                prompt: this.combineTemplate.format({
                    context: combinedTitles
                })
            });
            titlesByDocument[key] = completion.text;
        }
        return titlesByDocument;
    }
    async getTitlesCandidates(nodes) {
        const titleJobs = nodes.map(async (node)=>{
            const completion = await this.llm.complete({
                prompt: this.nodeTemplate.format({
                    context: node.getContent(_schema.MetadataMode.ALL)
                })
            });
            return completion.text;
        });
        return await Promise.all(titleJobs);
    }
}
class QuestionsAnsweredExtractor extends _types.BaseExtractor {
    /**
   * LLM instance.
   * @type {LLM}
   */ llm;
    /**
   * Number of questions to generate.
   * @type {number}
   * @default 5
   */ questions = 5;
    /**
   * The prompt template to use for the question extractor.
   * @type {string}
   */ promptTemplate;
    /**
   * Wheter to use metadata for embeddings only
   * @type {boolean}
   * @default false
   */ embeddingOnly = false;
    /**
   * Constructor for the QuestionsAnsweredExtractor class.
   * @param {LLM} llm LLM instance.
   * @param {number} questions Number of questions to generate.
   * @param {TextQAPrompt} promptTemplate The prompt template to use for the question extractor.
   * @param {boolean} embeddingOnly Wheter to use metadata for embeddings only.
   */ constructor(options){
        if (options?.questions && options.questions < 1) throw new Error("Questions must be greater than 0");
        super();
        this.llm = options?.llm ?? new _openai.OpenAI();
        this.questions = options?.questions ?? 5;
        this.promptTemplate = options?.promptTemplate ? new _prompts.PromptTemplate({
            templateVars: [
                "numQuestions",
                "context"
            ],
            template: options.promptTemplate
        }).partialFormat({
            numQuestions: "5"
        }) : _prompts.defaultQuestionExtractPrompt;
        this.embeddingOnly = options?.embeddingOnly ?? false;
    }
    /**
   * Extract answered questions from a node.
   * @param {BaseNode} node Node to extract questions from.
   * @returns {Promise<Array<ExtractQuestion> | Array<{}>>} Questions extracted from the node.
   */ async extractQuestionsFromNode(node) {
        if (this.isTextNodeOnly && !(node instanceof _schema.TextNode)) {
            return {};
        }
        const contextStr = node.getContent(this.metadataMode);
        const prompt = this.promptTemplate.format({
            context: contextStr,
            numQuestions: this.questions.toString()
        });
        const questions = await this.llm.complete({
            prompt
        });
        return {
            questionsThisExcerptCanAnswer: questions.text.replace(STRIP_REGEX, "")
        };
    }
    /**
   * Extract answered questions from a list of nodes.
   * @param {BaseNode[]} nodes Nodes to extract questions from.
   * @returns {Promise<Array<ExtractQuestion> | Array<{}>>} Questions extracted from the nodes.
   */ async extract(nodes) {
        const results = await Promise.all(nodes.map((node)=>this.extractQuestionsFromNode(node)));
        return results;
    }
}
class SummaryExtractor extends _types.BaseExtractor {
    /**
   * LLM instance.
   * @type {LLM}
   */ llm;
    /**
   * List of summaries to extract: 'self', 'prev', 'next'
   * @type {string[]}
   */ summaries;
    /**
   * The prompt template to use for the summary extractor.
   * @type {string}
   */ promptTemplate;
    selfSummary;
    prevSummary;
    nextSummary;
    constructor(options){
        const summaries = options?.summaries ?? [
            "self"
        ];
        if (summaries && !summaries.some((s)=>[
                "self",
                "prev",
                "next"
            ].includes(s))) throw new Error("Summaries must be one of 'self', 'prev', 'next'");
        super();
        this.llm = options?.llm ?? new _openai.OpenAI();
        this.summaries = summaries;
        this.promptTemplate = options?.promptTemplate ? new _prompts.PromptTemplate({
            templateVars: [
                "context"
            ],
            template: options.promptTemplate
        }) : _prompts.defaultSummaryPrompt;
        this.selfSummary = summaries?.includes("self") ?? false;
        this.prevSummary = summaries?.includes("prev") ?? false;
        this.nextSummary = summaries?.includes("next") ?? false;
    }
    /**
   * Extract summary from a node.
   * @param {BaseNode} node Node to extract summary from.
   * @returns {Promise<string>} Summary extracted from the node.
   */ async generateNodeSummary(node) {
        if (this.isTextNodeOnly && !(node instanceof _schema.TextNode)) {
            return "";
        }
        const context = node.getContent(this.metadataMode);
        const prompt = this.promptTemplate.format({
            context
        });
        const summary = await this.llm.complete({
            prompt
        });
        return summary.text.replace(STRIP_REGEX, "");
    }
    /**
   * Extract summaries from a list of nodes.
   * @param {BaseNode[]} nodes Nodes to extract summaries from.
   * @returns {Promise<Array<ExtractSummary> | Arry<{}>>} Summaries extracted from the nodes.
   */ async extract(nodes) {
        if (!nodes.every((n)=>n instanceof _schema.TextNode)) throw new Error("Only `TextNode` is allowed for `Summary` extractor");
        const nodeSummaries = await Promise.all(nodes.map((node)=>this.generateNodeSummary(node)));
        const metadataList = nodes.map(()=>({}));
        for(let i = 0; i < nodes.length; i++){
            if (i > 0 && this.prevSummary && nodeSummaries[i - 1]) {
                metadataList[i]["prevSectionSummary"] = nodeSummaries[i - 1];
            }
            if (i < nodes.length - 1 && this.nextSummary && nodeSummaries[i + 1]) {
                metadataList[i]["nextSectionSummary"] = nodeSummaries[i + 1];
            }
            if (this.selfSummary && nodeSummaries[i]) {
                metadataList[i]["sectionSummary"] = nodeSummaries[i];
            }
        }
        return metadataList;
    }
}
