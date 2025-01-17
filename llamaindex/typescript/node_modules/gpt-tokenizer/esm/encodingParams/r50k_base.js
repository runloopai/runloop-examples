import {} from '../modelParams.js';
import { EndOfText } from '../specialTokens.js';
import { R50K_TOKEN_SPLIT_REGEX } from './constants.js';
export function R50KBase(bytePairRankDecoder) {
    return {
        expectedVocabularySize: 50_257,
        tokenSplitRegex: R50K_TOKEN_SPLIT_REGEX,
        bytePairRankDecoder,
        specialTokensEncoder: new Map([[EndOfText, 50_256]]),
    };
}
//# sourceMappingURL=r50k_base.js.map