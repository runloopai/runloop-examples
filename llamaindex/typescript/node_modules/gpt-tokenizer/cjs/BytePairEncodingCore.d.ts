export type RawBytePairRanks = readonly (string | readonly number[])[];
export interface BytePairEncodingConfig {
    bytePairRankDecoder: RawBytePairRanks;
    specialTokensEncoder?: Map<string, number>;
    tokenSplitRegex: RegExp;
    /**
     * LRU cache for merged tokens pairs.
     * Increasing this value should make encoding similar strings faster,
     * but will consume more memory.
     * @default 100000
     */
    mergeCacheSize?: number;
}
export declare const decoder: TextDecoder;
export declare class BytePairEncodingCore {
    readonly mergeableBytePairRankCount: number;
    /**
     * an array where the index is the BPE rank,
     * and the value is the string or the array of bytes that it decodes to
     * it may contain holes if token is unused
     */
    private bytePairRankDecoder;
    private bytePairNonUtfRankDecoder;
    private bytePairNonUtfSortedEncoder;
    /**
     * a reverse map of the bytePairRankDecoder,
     * where the key is the string and the value is the rank
     * values that cannot be represented as a string are present in `bytePairNonUtfSortedEncoder`
     */
    private bytePairStringRankEncoder;
    private tokenSplitRegex;
    private specialTokensEncoder;
    private specialTokensDecoder;
    private specialTokenPatternRegex;
    private textEncoder;
    private mergeCache?;
    private mergeCacheSize;
    constructor({ bytePairRankDecoder, specialTokensEncoder, tokenSplitRegex, mergeCacheSize, }: BytePairEncodingConfig);
    setMergeCacheSize(newSize: number): void;
    clearMergeCache(): void;
    encodeNativeGenerator(text: string, allowedSpecial?: Set<string>): Generator<number[], number, undefined>;
    encodeNative(text: string, allowedSpecial?: Set<string>): number[];
    countNative(text: string, allowedSpecial?: Set<string>): number;
    decodeNativeGenerator(tokens: Iterable<number>): Generator<Uint8Array | string, void, void>;
    decodeNative(tokens: Iterable<number>): string;
    decodeNativeAsyncIterable(tokens: AsyncIterable<number>): AsyncGenerator<Uint8Array | string>;
    private getBpeRankFromString;
    private getBpeRankFromStringOrThrow;
    private getBpeRankFromBytes;
    private getBpeRankFromBytesOrThrow;
    private binarySearch;
    private findNextSpecialToken;
    private tryDecodeToken;
    private addToMergeCache;
    private bytePairEncode;
    private bytePairMerge;
}
