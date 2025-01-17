import type { LLM } from "@llamaindex/core/llms";
import { type KeywordExtractPrompt, type QuestionExtractPrompt, type SummaryPrompt, type TitleCombinePrompt, type TitleExtractorPrompt } from "@llamaindex/core/prompts";
import type { BaseNode } from "@llamaindex/core/schema";
import { BaseExtractor } from "./types.js";
type KeywordExtractArgs = {
    llm?: LLM;
    keywords?: number;
    promptTemplate?: KeywordExtractPrompt["template"];
};
type ExtractKeyword = {
    excerptKeywords: string;
};
/**
 * Extract keywords from a list of nodes.
 */
export declare class KeywordExtractor extends BaseExtractor {
    /**
     * LLM instance.
     * @type {LLM}
     */
    llm: LLM;
    /**
     * Number of keywords to extract.
     * @type {number}
     * @default 5
     */
    keywords: number;
    /**
     * The prompt template to use for the question extractor.
     * @type {string}
     */
    promptTemplate: KeywordExtractPrompt;
    /**
     * Constructor for the KeywordExtractor class.
     * @param {LLM} llm LLM instance.
     * @param {number} keywords Number of keywords to extract.
     * @throws {Error} If keywords is less than 1.
     */
    constructor(options?: KeywordExtractArgs);
    /**
     *
     * @param node Node to extract keywords from.
     * @returns Keywords extracted from the node.
     */
    extractKeywordsFromNodes(node: BaseNode): Promise<ExtractKeyword | object>;
    /**
     *
     * @param nodes Nodes to extract keywords from.
     * @returns Keywords extracted from the nodes.
     */
    extract(nodes: BaseNode[]): Promise<Array<ExtractKeyword> | Array<object>>;
}
type TitleExtractorsArgs = {
    llm?: LLM;
    nodes?: number;
    nodeTemplate?: TitleExtractorPrompt["template"];
    combineTemplate?: TitleCombinePrompt["template"];
};
type ExtractTitle = {
    documentTitle: string;
};
/**
 * Extract title from a list of nodes.
 */
export declare class TitleExtractor extends BaseExtractor {
    /**
     * LLM instance.
     * @type {LLM}
     */
    llm: LLM;
    /**
     * Can work for mixture of text and non-text nodes
     * @type {boolean}
     * @default false
     */
    isTextNodeOnly: boolean;
    /**
     * Number of nodes to extrct titles from.
     * @type {number}
     * @default 5
     */
    nodes: number;
    /**
     * The prompt template to use for the title extractor.
     * @type {string}
     */
    nodeTemplate: TitleExtractorPrompt;
    /**
     * The prompt template to merge title with..
     * @type {string}
     */
    combineTemplate: TitleCombinePrompt;
    /**
     * Constructor for the TitleExtractor class.
     * @param {LLM} llm LLM instance.
     * @param {number} nodes Number of nodes to extract titles from.
     * @param {TitleExtractorPrompt} nodeTemplate The prompt template to use for the title extractor.
     * @param {string} combineTemplate The prompt template to merge title with..
     */
    constructor(options?: TitleExtractorsArgs);
    /**
     * Extract titles from a list of nodes.
     * @param {BaseNode[]} nodes Nodes to extract titles from.
     * @returns {Promise<BaseNode<ExtractTitle>[]>} Titles extracted from the nodes.
     */
    extract(nodes: BaseNode[]): Promise<Array<ExtractTitle>>;
    private filterNodes;
    private separateNodesByDocument;
    private extractTitles;
    private getTitlesCandidates;
}
type QuestionAnswerExtractArgs = {
    llm?: LLM;
    questions?: number;
    promptTemplate?: QuestionExtractPrompt["template"];
    embeddingOnly?: boolean;
};
type ExtractQuestion = {
    questionsThisExcerptCanAnswer: string;
};
/**
 * Extract questions from a list of nodes.
 */
export declare class QuestionsAnsweredExtractor extends BaseExtractor {
    /**
     * LLM instance.
     * @type {LLM}
     */
    llm: LLM;
    /**
     * Number of questions to generate.
     * @type {number}
     * @default 5
     */
    questions: number;
    /**
     * The prompt template to use for the question extractor.
     * @type {string}
     */
    promptTemplate: QuestionExtractPrompt;
    /**
     * Wheter to use metadata for embeddings only
     * @type {boolean}
     * @default false
     */
    embeddingOnly: boolean;
    /**
     * Constructor for the QuestionsAnsweredExtractor class.
     * @param {LLM} llm LLM instance.
     * @param {number} questions Number of questions to generate.
     * @param {TextQAPrompt} promptTemplate The prompt template to use for the question extractor.
     * @param {boolean} embeddingOnly Wheter to use metadata for embeddings only.
     */
    constructor(options?: QuestionAnswerExtractArgs);
    /**
     * Extract answered questions from a node.
     * @param {BaseNode} node Node to extract questions from.
     * @returns {Promise<Array<ExtractQuestion> | Array<{}>>} Questions extracted from the node.
     */
    extractQuestionsFromNode(node: BaseNode): Promise<ExtractQuestion | object>;
    /**
     * Extract answered questions from a list of nodes.
     * @param {BaseNode[]} nodes Nodes to extract questions from.
     * @returns {Promise<Array<ExtractQuestion> | Array<{}>>} Questions extracted from the nodes.
     */
    extract(nodes: BaseNode[]): Promise<Array<ExtractQuestion> | Array<object>>;
}
type SummaryExtractArgs = {
    llm?: LLM;
    summaries?: string[];
    promptTemplate?: SummaryPrompt["template"];
};
type ExtractSummary = {
    sectionSummary: string;
    prevSectionSummary: string;
    nextSectionSummary: string;
};
/**
 * Extract summary from a list of nodes.
 */
export declare class SummaryExtractor extends BaseExtractor {
    /**
     * LLM instance.
     * @type {LLM}
     */
    llm: LLM;
    /**
     * List of summaries to extract: 'self', 'prev', 'next'
     * @type {string[]}
     */
    summaries: string[];
    /**
     * The prompt template to use for the summary extractor.
     * @type {string}
     */
    promptTemplate: SummaryPrompt;
    private selfSummary;
    private prevSummary;
    private nextSummary;
    constructor(options?: SummaryExtractArgs);
    /**
     * Extract summary from a node.
     * @param {BaseNode} node Node to extract summary from.
     * @returns {Promise<string>} Summary extracted from the node.
     */
    generateNodeSummary(node: BaseNode): Promise<string>;
    /**
     * Extract summaries from a list of nodes.
     * @param {BaseNode[]} nodes Nodes to extract summaries from.
     * @returns {Promise<Array<ExtractSummary> | Arry<{}>>} Summaries extracted from the nodes.
     */
    extract(nodes: BaseNode[]): Promise<Array<ExtractSummary> | Array<object>>;
}
export {};
