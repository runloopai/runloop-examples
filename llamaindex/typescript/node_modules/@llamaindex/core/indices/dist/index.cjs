Object.defineProperty(exports, '__esModule', { value: true });

var index_cjs = require('../../global/dist/index.cjs');
var index_cjs$2 = require('../../node-parser/dist/index.cjs');
var index_cjs$1 = require('../../prompts/dist/index.cjs');

/**
 * Get the empty prompt text given a prompt.
 */ function getEmptyPromptTxt(prompt) {
    return prompt.format(Object.fromEntries([
        ...prompt.templateVars.keys()
    ].map((key)=>[
            key,
            ""
        ])));
}
/**
 * Get biggest empty prompt size from a list of prompts.
 * Used to calculate the maximum size of inputs to the LLM.
 */ function getBiggestPrompt(prompts) {
    const emptyPromptTexts = prompts.map(getEmptyPromptTxt);
    const emptyPromptLengths = emptyPromptTexts.map((text)=>text.length);
    const maxEmptyPromptLength = Math.max(...emptyPromptLengths);
    const maxEmptyPromptIndex = emptyPromptLengths.indexOf(maxEmptyPromptLength);
    return prompts[maxEmptyPromptIndex];
}
/**
 * A collection of helper functions for working with prompts.
 */ class PromptHelper {
    constructor(options = {}){
        const { contextWindow = index_cjs.DEFAULT_CONTEXT_WINDOW, numOutput = index_cjs.DEFAULT_NUM_OUTPUTS, chunkOverlapRatio = index_cjs.DEFAULT_CHUNK_OVERLAP_RATIO, chunkSizeLimit, tokenizer, separator = " " } = options;
        this.contextWindow = contextWindow;
        this.numOutput = numOutput;
        this.chunkOverlapRatio = chunkOverlapRatio;
        this.chunkSizeLimit = chunkSizeLimit;
        this.tokenizer = tokenizer ?? index_cjs.Settings.tokenizer;
        this.separator = separator;
    }
    /**
   * Calculate the available context size based on the number of prompt tokens.
   */ #getAvailableContextSize(numPromptTokens) {
        const contextSizeTokens = this.contextWindow - numPromptTokens - this.numOutput;
        if (contextSizeTokens < 0) {
            throw new Error(`Calculated available context size ${contextSizeTokens} is not non-negative.`);
        }
        return contextSizeTokens;
    }
    /**
   * Calculate the available chunk size based on the prompt and other parameters.
   */ #getAvailableChunkSize(prompt, numChunks = 1, padding = 5) {
        let numPromptTokens = 0;
        if (prompt instanceof index_cjs$1.PromptTemplate) {
            numPromptTokens = this.tokenizer.encode(getEmptyPromptTxt(prompt)).length;
        }
        const availableContextSize = this.#getAvailableContextSize(numPromptTokens);
        let result = Math.floor(availableContextSize / numChunks) - padding;
        if (this.chunkSizeLimit !== undefined) {
            result = Math.min(this.chunkSizeLimit, result);
        }
        return result;
    }
    /**
   * Creates a text splitter configured to maximally pack the available context window.
   */ getTextSplitterGivenPrompt(prompt, numChunks = 1, padding = index_cjs.DEFAULT_PADDING) {
        const chunkSize = this.#getAvailableChunkSize(prompt, numChunks, padding);
        if (chunkSize <= 0) {
            throw new TypeError(`Chunk size ${chunkSize} is not positive.`);
        }
        const chunkOverlap = Math.floor(this.chunkOverlapRatio * chunkSize);
        return new index_cjs$2.TokenTextSplitter({
            separator: this.separator,
            chunkSize,
            chunkOverlap,
            tokenizer: this.tokenizer
        });
    }
    /**
   * Truncate text chunks to fit within the available context window.
   */ truncate(prompt, textChunks, padding = index_cjs.DEFAULT_PADDING) {
        const textSplitter = this.getTextSplitterGivenPrompt(prompt, textChunks.length, padding);
        return textChunks.map((chunk)=>index_cjs$2.truncateText(chunk, textSplitter));
    }
    /**
   * Repack text chunks to better utilize the available context window.
   */ repack(prompt, textChunks, padding = index_cjs.DEFAULT_PADDING) {
        const textSplitter = this.getTextSplitterGivenPrompt(prompt, 1, padding);
        const combinedStr = textChunks.map((c)=>c.trim()).filter((c)=>c.length > 0).join("\n\n");
        return textSplitter.splitText(combinedStr);
    }
    static fromLLMMetadata(metadata, options) {
        const { chunkOverlapRatio = index_cjs.DEFAULT_CHUNK_OVERLAP_RATIO, chunkSizeLimit = undefined, tokenizer = index_cjs.Settings.tokenizer, separator = " " } = options ?? {};
        return new PromptHelper({
            contextWindow: metadata.contextWindow,
            // fixme: numOutput is not in LLMMetadata
            numOutput: index_cjs.DEFAULT_NUM_OUTPUTS,
            chunkOverlapRatio,
            chunkSizeLimit,
            tokenizer,
            separator
        });
    }
}

exports.PromptHelper = PromptHelper;
exports.getBiggestPrompt = getBiggestPrompt;
