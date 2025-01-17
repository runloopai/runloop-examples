export declare function expandTokensWithSubtokens(tokens: Set<string>): Set<string>;
export declare function extractKeywordsGivenResponse(response: string, startToken?: string, lowercase?: boolean): Set<string>;
export declare function simpleExtractKeywords(textChunk: string, maxKeywords?: number): Set<string>;
export declare function rakeExtractKeywords(textChunk: string, maxKeywords?: number): Set<string>;
