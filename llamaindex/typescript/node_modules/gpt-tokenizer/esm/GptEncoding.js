/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-param-reassign */
import { BytePairEncodingCore, decoder } from './BytePairEncodingCore.js';
import { ALL_SPECIAL_TOKENS } from './constants.js';
import { chatModelParams, modelToEncodingMap, } from './mapping.js';
import { getEncodingParams, } from './modelParams.js';
import { EndOfPrompt, EndOfText, FimMiddle, FimPrefix, FimSuffix, ImEnd, ImSep, ImStart, } from './specialTokens.js';
import { endsWithIncompleteUtfPairSurrogate } from './utfUtil.js';
import { getMaxValueFromMap, getSpecialTokenRegex } from './util.js';
export class GptEncoding {
    static EndOfPrompt = EndOfPrompt;
    static EndOfText = EndOfText;
    static FimMiddle = FimMiddle;
    static FimPrefix = FimPrefix;
    static FimSuffix = FimSuffix;
    modelName;
    bytePairEncodingCoreProcessor;
    specialTokensEncoder;
    specialTokensSet;
    allSpecialTokenRegex;
    defaultSpecialTokenConfig;
    vocabularySize;
    constructor({ bytePairRankDecoder: mergeableBytePairRanks, specialTokensEncoder, expectedVocabularySize, modelName, ...rest }) {
        this.specialTokensEncoder = specialTokensEncoder;
        this.specialTokensSet = new Set(this.specialTokensEncoder.keys());
        this.allSpecialTokenRegex = getSpecialTokenRegex(this.specialTokensSet);
        this.bytePairEncodingCoreProcessor = new BytePairEncodingCore({
            bytePairRankDecoder: mergeableBytePairRanks,
            specialTokensEncoder,
            ...rest,
        });
        this.defaultSpecialTokenConfig = this.processSpecialTokens();
        const maxTokenValue = Math.max(mergeableBytePairRanks.length - 1, getMaxValueFromMap(specialTokensEncoder));
        this.vocabularySize =
            this.bytePairEncodingCoreProcessor.mergeableBytePairRankCount +
                specialTokensEncoder.size;
        if (expectedVocabularySize !== undefined) {
            if (this.vocabularySize !== expectedVocabularySize) {
                throw new Error('The number of mergeable tokens and special tokens must be equal to expectedVocabularySize.');
            }
            if (maxTokenValue !== expectedVocabularySize - 1) {
                throw new Error(`The model encodings are invalid. The maximum token value must be equal to expectedVocabularySize - 1. Currently ${maxTokenValue}, expected ${expectedVocabularySize - 1}`);
            }
        }
        this.encode = this.encode.bind(this);
        this.decode = this.decode.bind(this);
        this.encodeGenerator = this.encodeGenerator.bind(this);
        this.decodeGenerator = this.decodeGenerator.bind(this);
        this.decodeAsyncGenerator = this.decodeAsyncGenerator.bind(this);
        this.decodeAsync = this.decodeAsync.bind(this);
        this.isWithinTokenLimit = this.isWithinTokenLimit.bind(this);
        this.encodeChat = this.encodeChat.bind(this);
        this.encodeChatGenerator = this.encodeChatGenerator.bind(this);
        this.countTokens = this.countTokens.bind(this);
        this.setMergeCacheSize = this.setMergeCacheSize.bind(this);
        this.clearMergeCache = this.clearMergeCache.bind(this);
        this.modelName = modelName;
    }
    static getEncodingApi(encodingName, getMergeableRanks) {
        const modelParams = getEncodingParams(encodingName, getMergeableRanks);
        return new GptEncoding(modelParams);
    }
    static getEncodingApiForModel(modelName, getMergeableRanks) {
        const encodingName = modelToEncodingMap[modelName];
        const modelParams = getEncodingParams(encodingName, getMergeableRanks);
        return new GptEncoding({ ...modelParams, modelName });
    }
    processSpecialTokens({ allowedSpecial, disallowedSpecial, } = {}) {
        let regexPattern;
        if (allowedSpecial === ALL_SPECIAL_TOKENS ||
            allowedSpecial?.has(ALL_SPECIAL_TOKENS)) {
            allowedSpecial = new Set(this.specialTokensSet);
            const allowedSpecialSet = allowedSpecial;
            if (disallowedSpecial === ALL_SPECIAL_TOKENS) {
                throw new Error('allowedSpecial and disallowedSpecial cannot both be set to "all".');
            }
            if (typeof disallowedSpecial === 'object') {
                // remove any special tokens that are disallowed
                disallowedSpecial.forEach((val) => allowedSpecialSet.delete(val));
            }
            else {
                // all special tokens are allowed, and no 'disallowedSpecial' is provided
                disallowedSpecial = new Set();
            }
        }
        if (!disallowedSpecial ||
            disallowedSpecial === ALL_SPECIAL_TOKENS ||
            disallowedSpecial.has(ALL_SPECIAL_TOKENS)) {
            // by default, all special tokens are disallowed
            disallowedSpecial = new Set(this.specialTokensSet);
            const disallowedSpecialSet = disallowedSpecial;
            if (allowedSpecial?.size) {
                allowedSpecial.forEach((val) => disallowedSpecialSet.delete(val));
                // disallowed takes precedence over allowed
                disallowedSpecial.forEach((val) => allowedSpecial.delete(val));
                if (disallowedSpecial.size > 0) {
                    regexPattern = getSpecialTokenRegex(disallowedSpecial);
                }
            }
            else {
                regexPattern = this.allSpecialTokenRegex;
            }
        }
        return { allowedSpecial, regexPattern };
    }
    encodeGenerator(lineToEncode, encodeOptions) {
        const specialTokenConfig = encodeOptions
            ? this.processSpecialTokens(encodeOptions)
            : this.defaultSpecialTokenConfig;
        if (specialTokenConfig.regexPattern) {
            const match = lineToEncode.match(specialTokenConfig.regexPattern);
            if (match !== null) {
                throw new Error(`Disallowed special token found: ${match[0]}`);
            }
        }
        return this.bytePairEncodingCoreProcessor.encodeNativeGenerator(lineToEncode, specialTokenConfig.allowedSpecial);
    }
    encode(lineToEncode, encodeOptions) {
        const specialTokenConfig = encodeOptions
            ? this.processSpecialTokens(encodeOptions)
            : this.defaultSpecialTokenConfig;
        if (specialTokenConfig.regexPattern) {
            const match = lineToEncode.match(specialTokenConfig.regexPattern);
            if (match !== null) {
                throw new Error(`Disallowed special token found: ${match[0]}`);
            }
        }
        return this.bytePairEncodingCoreProcessor.encodeNative(lineToEncode, specialTokenConfig.allowedSpecial);
    }
    /**
     * Progressively tokenizes an OpenAI chat.
     * Warning: gpt-3.5-turbo and gpt-4 chat format may change over time.
     * Returns tokens assuming the 'gpt-3.5-turbo-0301' / 'gpt-4-0314' format.
     * Based on OpenAI's guidelines: https://github.com/openai/openai-python/blob/main/chatml.md
     * Also mentioned in section 6 of this document: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
     */
    *encodeChatGenerator(chat, model = this.modelName) {
        if (!model) {
            throw new Error('Model name must be provided either during initialization or passed in to the method.');
        }
        const params = chatModelParams[model];
        const chatStartToken = this.specialTokensEncoder.get(ImStart);
        const chatEndToken = this.specialTokensEncoder.get(ImEnd);
        if (!params || chatStartToken === undefined || chatEndToken === undefined) {
            throw new Error(`Model '${model}' does not support chat.`);
        }
        const allowedSpecial = new Set([ImSep]);
        const { messageSeparator, roleSeparator } = params;
        const encodedMessageSeparator = messageSeparator.length > 0 ? this.encode(messageSeparator) : [];
        const encodedRoleSeparator = roleSeparator.length > 0
            ? this.encode(roleSeparator, { allowedSpecial })
            : [];
        const nameCache = new Map();
        for (const { role = 'system', name = role, content } of chat) {
            if (content === undefined) {
                throw new Error('Content must be defined for all messages.');
            }
            yield [chatStartToken];
            const encodedName = nameCache.get(name) ?? this.encode(name);
            nameCache.set(name, encodedName);
            yield encodedName;
            if (encodedRoleSeparator.length > 0) {
                yield encodedRoleSeparator;
            }
            yield* this.encodeGenerator(content);
            yield [chatEndToken];
            yield encodedMessageSeparator;
        }
        // every reply is primed with <|start|>assistant<|message|>
        yield [chatStartToken];
        yield* this.encodeGenerator('assistant');
        if (encodedRoleSeparator.length > 0) {
            yield encodedRoleSeparator;
        }
    }
    /**
     * Encodes a chat into a single array of tokens.
     * Warning: gpt-3.5-turbo and gpt-4 chat format may change over time.
     * Returns tokens assuming the 'gpt-3.5-turbo-0301' / 'gpt-4-0314' format.
     * Based on OpenAI's guidelines: https://github.com/openai/openai-python/blob/main/chatml.md
     * Also mentioned in section 6 of this document: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
     */
    encodeChat(chat, model = this.modelName) {
        return [...this.encodeChatGenerator(chat, model)].flat();
    }
    /**
     * @returns {false | number} false if token limit is exceeded, otherwise the number of tokens
     */
    isWithinTokenLimit(input, tokenLimit) {
        const tokenGenerator = typeof input === 'string'
            ? this.encodeGenerator(input)
            : this.encodeChatGenerator(input);
        let count = 0;
        for (const tokens of tokenGenerator) {
            count += tokens.length;
            if (count > tokenLimit) {
                return false;
            }
        }
        return count;
    }
    /**
     * Counts the number of tokens in the input.
     * @returns {number} The number of tokens.
     */
    countTokens(input, encodeOptions) {
        if (typeof input === 'string') {
            const specialTokenConfig = encodeOptions
                ? this.processSpecialTokens(encodeOptions)
                : this.defaultSpecialTokenConfig;
            if (specialTokenConfig.regexPattern) {
                const match = input.match(specialTokenConfig.regexPattern);
                if (match !== null) {
                    throw new Error(`Disallowed special token found: ${match[0]}`);
                }
            }
            return this.bytePairEncodingCoreProcessor.countNative(input, specialTokenConfig.allowedSpecial);
        }
        const tokenGenerator = this.encodeChatGenerator(input);
        let count = 0;
        for (const tokens of tokenGenerator) {
            count += tokens.length;
        }
        return count;
    }
    setMergeCacheSize(size) {
        this.bytePairEncodingCoreProcessor.setMergeCacheSize(size);
    }
    clearMergeCache() {
        this.bytePairEncodingCoreProcessor.clearMergeCache();
    }
    decode(inputTokensToDecode) {
        return this.bytePairEncodingCoreProcessor.decodeNative(inputTokensToDecode);
    }
    *decodeGenerator(inputTokensToDecode) {
        const decodedByteGenerator = this.bytePairEncodingCoreProcessor.decodeNativeGenerator(inputTokensToDecode);
        let buffer = '';
        for (const decodedPart of decodedByteGenerator) {
            buffer +=
                typeof decodedPart === 'string'
                    ? decodedPart
                    : decoder.decode(decodedPart, { stream: true });
            if (buffer.length === 0 || endsWithIncompleteUtfPairSurrogate(buffer)) {
                // Keep the high surrogate in the buffer and continue with the next token
                // eslint-disable-next-line no-continue
                continue;
            }
            else {
                yield buffer;
                // reset buffer
                buffer = '';
            }
        }
        // Yield any remaining characters in the buffer
        if (buffer.length > 0) {
            yield buffer;
        }
    }
    async *decodeAsyncGenerator(inputTokensToDecode) {
        const decodedByteGenerator = this.bytePairEncodingCoreProcessor.decodeNativeAsyncIterable(inputTokensToDecode);
        let buffer = '';
        for await (const decodedPart of decodedByteGenerator) {
            buffer +=
                typeof decodedPart === 'string'
                    ? decodedPart
                    : decoder.decode(decodedPart, { stream: true });
            if (buffer.length === 0 || endsWithIncompleteUtfPairSurrogate(buffer)) {
                // Keep the high surrogate in the buffer and continue with the next token
                // eslint-disable-next-line no-continue
                continue;
            }
            else {
                yield buffer;
                // reset buffer
                buffer = '';
            }
        }
        // Yield any remaining characters in the buffer
        if (buffer.length > 0) {
            yield buffer;
        }
    }
    async decodeAsync(inputTokensToDecode) {
        const decodedByteGenerator = this.bytePairEncodingCoreProcessor.decodeNativeAsyncIterable(inputTokensToDecode);
        let buffer = '';
        for await (const decodedPart of decodedByteGenerator) {
            buffer +=
                typeof decodedPart === 'string'
                    ? decodedPart
                    : decoder.decode(decodedPart, { stream: true });
        }
        return buffer;
    }
}
//# sourceMappingURL=GptEncoding.js.map