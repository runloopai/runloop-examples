"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.O200KBase = O200KBase;
const specialTokens_js_1 = require("../specialTokens.js");
const constants_js_1 = require("./constants.js");
function O200KBase(bytePairRankDecoder) {
    const specialTokenMapping = new Map([
        [specialTokens_js_1.EndOfText, 199_999],
        [specialTokens_js_1.FimPrefix, 200_000],
        [specialTokens_js_1.FimMiddle, 200_001],
        [specialTokens_js_1.FimSuffix, 200_002],
        [specialTokens_js_1.ImStart, 200_003],
        [specialTokens_js_1.ImEnd, 200_004],
        [specialTokens_js_1.ImSep, 200_005],
        [specialTokens_js_1.EndOfPrompt, 200_006],
    ]);
    return {
        tokenSplitRegex: constants_js_1.CL_AND_O_TOKEN_SPLIT_PATTERN,
        bytePairRankDecoder,
        specialTokensEncoder: specialTokenMapping,
    };
}
//# sourceMappingURL=o200k_base.js.map