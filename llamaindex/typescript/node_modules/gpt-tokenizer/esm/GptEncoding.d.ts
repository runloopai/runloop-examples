import { ALL_SPECIAL_TOKENS } from './constants.js';
import { type EncodingName, type ModelName } from './mapping.js';
import { type GetMergeableRanksFn } from './modelParams.js';
export interface EncodeOptions {
    /**
     * A list of special tokens that are allowed in the input.
     * If set to 'all', all special tokens are allowed except those in disallowedSpecial.
     * @default undefined
     */
    allowedSpecial?: Set<string> | typeof ALL_SPECIAL_TOKENS;
    /**
     * A list of special tokens that are disallowed in the input.
     * If set to 'all', all special tokens are disallowed except those in allowedSpecial.
     * @default 'all'
     */
    disallowedSpecial?: Set<string> | typeof ALL_SPECIAL_TOKENS;
}
export interface ChatMessage {
    role?: 'system' | 'user' | 'assistant';
    name?: string;
    content: string;
}
export interface EncodeChatOptions {
    primeWithAssistantResponse?: string;
}
export declare class GptEncoding {
    static EndOfPrompt: string;
    static EndOfText: string;
    static FimMiddle: string;
    static FimPrefix: string;
    static FimSuffix: string;
    modelName?: ModelName;
    private bytePairEncodingCoreProcessor;
    private specialTokensEncoder;
    private specialTokensSet;
    private allSpecialTokenRegex;
    private defaultSpecialTokenConfig;
    readonly vocabularySize: number;
    private constructor();
    static getEncodingApi(encodingName: EncodingName, getMergeableRanks: GetMergeableRanksFn): GptEncoding;
    static getEncodingApiForModel(modelName: ModelName, getMergeableRanks: GetMergeableRanksFn): GptEncoding;
    private processSpecialTokens;
    encodeGenerator(lineToEncode: string, encodeOptions?: EncodeOptions): Generator<number[], number, undefined>;
    encode(lineToEncode: string, encodeOptions?: EncodeOptions): number[];
    /**
     * Progressively tokenizes an OpenAI chat.
     * Warning: gpt-3.5-turbo and gpt-4 chat format may change over time.
     * Returns tokens assuming the 'gpt-3.5-turbo-0301' / 'gpt-4-0314' format.
     * Based on OpenAI's guidelines: https://github.com/openai/openai-python/blob/main/chatml.md
     * Also mentioned in section 6 of this document: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
     */
    encodeChatGenerator(chat: Iterable<ChatMessage>, model?: "gpt-4o" | "gpt-3.5-turbo" | "gpt-3.5-turbo-instruct" | "babbage-002" | "davinci-002" | "text-embedding-3-small" | "o1-preview" | "o1-preview-2024-09-12" | "o1-mini" | "o1-mini-2024-09-12" | "chatgpt-4o-latest" | "gpt-4o-2024-08-06" | "gpt-4o-2024-05-13" | "gpt-4o-mini" | "gpt-4o-mini-2024-07-18" | "gpt-4o-realtime-preview" | "gpt-4o-realtime-preview-2024-10-01" | "gpt-4o-audio-preview" | "gpt-4o-audio-preview-2024-10-01" | "gpt-4o-2024-08-06-finetune" | "gpt-4o-mini-2024-07-18-finetune" | "gpt-4o-mini-training" | "gpt-4o-mini-training-2024-07-18" | "gpt-4-turbo" | "gpt-4-turbo-2024-04-09" | "gpt-4-turbo-preview" | "gpt-4-0125-preview" | "gpt-4-1106-preview" | "gpt-4" | "gpt-4-0613" | "gpt-3.5-turbo-0125" | "gpt-3.5-turbo-1106" | "gpt-3.5-turbo-finetune" | "gpt-3.5-turbo-16k" | "gpt-4-32k" | "gpt-4-32k-0613" | "gpt-4-vision-preview" | "gpt-4-1106-vision-preview" | "gpt-4-0314" | "gpt-4-32k-0314" | "gpt-3.5-turbo-0613" | "gpt-3.5-turbo-16k-0613" | "gpt-3.5-turbo-0301" | "text-embedding-3-large" | "text-embedding-ada-002" | "gpt-3.5-turbo-instruct-0914" | "text-ada-001" | "text-babbage-001" | "text-curie-001" | "text-davinci-001" | "text-davinci-002" | "text-davinci-003" | "ada" | "babbage" | "curie" | "davinci" | "code-davinci-002" | "code-davinci-001" | "davinci-codex" | "code-davinci-edit-001" | "code-cushman-002" | "code-cushman-001" | "cushman-codex" | "code-search-ada-code-001" | "code-search-ada-text-001" | "text-davinci-edit-001" | "text-similarity-ada-001" | "text-search-ada-doc-001" | "text-search-ada-query-001" | "text-similarity-babbage-001" | "text-search-babbage-doc-001" | "text-search-babbage-query-001" | "code-search-babbage-code-001" | "code-search-babbage-text-001" | "text-similarity-curie-001" | "text-search-curie-doc-001" | "text-search-curie-query-001" | "text-similarity-davinci-001" | "text-search-davinci-doc-001" | "text-search-davinci-query-001" | undefined): Generator<number[], void, undefined>;
    /**
     * Encodes a chat into a single array of tokens.
     * Warning: gpt-3.5-turbo and gpt-4 chat format may change over time.
     * Returns tokens assuming the 'gpt-3.5-turbo-0301' / 'gpt-4-0314' format.
     * Based on OpenAI's guidelines: https://github.com/openai/openai-python/blob/main/chatml.md
     * Also mentioned in section 6 of this document: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
     */
    encodeChat(chat: readonly ChatMessage[], model?: "gpt-4o" | "gpt-3.5-turbo" | "gpt-3.5-turbo-instruct" | "babbage-002" | "davinci-002" | "text-embedding-3-small" | "o1-preview" | "o1-preview-2024-09-12" | "o1-mini" | "o1-mini-2024-09-12" | "chatgpt-4o-latest" | "gpt-4o-2024-08-06" | "gpt-4o-2024-05-13" | "gpt-4o-mini" | "gpt-4o-mini-2024-07-18" | "gpt-4o-realtime-preview" | "gpt-4o-realtime-preview-2024-10-01" | "gpt-4o-audio-preview" | "gpt-4o-audio-preview-2024-10-01" | "gpt-4o-2024-08-06-finetune" | "gpt-4o-mini-2024-07-18-finetune" | "gpt-4o-mini-training" | "gpt-4o-mini-training-2024-07-18" | "gpt-4-turbo" | "gpt-4-turbo-2024-04-09" | "gpt-4-turbo-preview" | "gpt-4-0125-preview" | "gpt-4-1106-preview" | "gpt-4" | "gpt-4-0613" | "gpt-3.5-turbo-0125" | "gpt-3.5-turbo-1106" | "gpt-3.5-turbo-finetune" | "gpt-3.5-turbo-16k" | "gpt-4-32k" | "gpt-4-32k-0613" | "gpt-4-vision-preview" | "gpt-4-1106-vision-preview" | "gpt-4-0314" | "gpt-4-32k-0314" | "gpt-3.5-turbo-0613" | "gpt-3.5-turbo-16k-0613" | "gpt-3.5-turbo-0301" | "text-embedding-3-large" | "text-embedding-ada-002" | "gpt-3.5-turbo-instruct-0914" | "text-ada-001" | "text-babbage-001" | "text-curie-001" | "text-davinci-001" | "text-davinci-002" | "text-davinci-003" | "ada" | "babbage" | "curie" | "davinci" | "code-davinci-002" | "code-davinci-001" | "davinci-codex" | "code-davinci-edit-001" | "code-cushman-002" | "code-cushman-001" | "cushman-codex" | "code-search-ada-code-001" | "code-search-ada-text-001" | "text-davinci-edit-001" | "text-similarity-ada-001" | "text-search-ada-doc-001" | "text-search-ada-query-001" | "text-similarity-babbage-001" | "text-search-babbage-doc-001" | "text-search-babbage-query-001" | "code-search-babbage-code-001" | "code-search-babbage-text-001" | "text-similarity-curie-001" | "text-search-curie-doc-001" | "text-search-curie-query-001" | "text-similarity-davinci-001" | "text-search-davinci-doc-001" | "text-search-davinci-query-001" | undefined): number[];
    /**
     * @returns {false | number} false if token limit is exceeded, otherwise the number of tokens
     */
    isWithinTokenLimit(input: string | Iterable<ChatMessage>, tokenLimit: number): false | number;
    /**
     * Counts the number of tokens in the input.
     * @returns {number} The number of tokens.
     */
    countTokens(input: string | Iterable<ChatMessage>, encodeOptions?: EncodeOptions): number;
    setMergeCacheSize(size: number): void;
    clearMergeCache(): void;
    decode(inputTokensToDecode: Iterable<number>): string;
    decodeGenerator(inputTokensToDecode: Iterable<number>): Generator<string, void, void>;
    decodeAsyncGenerator(inputTokensToDecode: AsyncIterable<number>): AsyncGenerator<string, void>;
    decodeAsync(inputTokensToDecode: AsyncIterable<number>): Promise<string>;
}
