import { EndOfPrompt, EndOfText, FimMiddle, FimPrefix, FimSuffix, ImEnd, ImSep, ImStart, } from '../specialTokens.js';
import { CL_AND_O_TOKEN_SPLIT_PATTERN } from './constants.js';
export function O200KBase(bytePairRankDecoder) {
    const specialTokenMapping = new Map([
        [EndOfText, 199_999],
        [FimPrefix, 200_000],
        [FimMiddle, 200_001],
        [FimSuffix, 200_002],
        [ImStart, 200_003],
        [ImEnd, 200_004],
        [ImSep, 200_005],
        [EndOfPrompt, 200_006],
    ]);
    return {
        tokenSplitRegex: CL_AND_O_TOKEN_SPLIT_PATTERN,
        bytePairRankDecoder,
        specialTokensEncoder: specialTokenMapping,
    };
}
//# sourceMappingURL=o200k_base.js.map