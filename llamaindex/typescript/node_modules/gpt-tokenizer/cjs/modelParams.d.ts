import type { BytePairEncodingConfig, RawBytePairRanks } from './BytePairEncodingCore.js';
import type { EncodingName, ModelName } from './mapping.js';
export interface EncodingParams extends BytePairEncodingConfig {
    /**
     * The expected total number of tokens in the vocabulary, including both regular and special tokens.
     * This parameter is used to ensure that the combined number of regular and special tokens matches the expected total.
     */
    expectedVocabularySize?: number;
    /**
     * A regular expression that is designed to tokenize or break up a text into parts
     * that can be contractions, letters, numbers, or other characters,
     * while handling line terminators and spaces in a specific manner.
     * It's complex due to its need to deal with a wide variety of cases in text processing.
     */
    tokenSplitRegex: RegExp;
    specialTokensEncoder: Map<string, number>;
    modelName?: ModelName;
}
export type GetMergeableRanksFn = (encodingName: EncodingName) => RawBytePairRanks;
export declare function getEncodingParams(encodingName: EncodingName, getMergeableRanks: GetMergeableRanksFn): EncodingParams;
