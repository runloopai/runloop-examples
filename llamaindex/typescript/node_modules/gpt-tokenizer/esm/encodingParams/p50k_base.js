import {} from '../modelParams.js';
import { EndOfText } from '../specialTokens.js';
import { R50K_TOKEN_SPLIT_REGEX } from './constants.js';
export function P50KBase(bytePairRankDecoder) {
    return {
        expectedVocabularySize: 50_281,
        tokenSplitRegex: R50K_TOKEN_SPLIT_REGEX,
        bytePairRankDecoder,
        specialTokensEncoder: new Map([[EndOfText, 50_256]]),
    };
}
//# sourceMappingURL=p50k_base.js.map