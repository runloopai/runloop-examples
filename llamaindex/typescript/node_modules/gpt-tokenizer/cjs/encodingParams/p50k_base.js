"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P50KBase = P50KBase;
const specialTokens_js_1 = require("../specialTokens.js");
const constants_js_1 = require("./constants.js");
function P50KBase(bytePairRankDecoder) {
    return {
        expectedVocabularySize: 50_281,
        tokenSplitRegex: constants_js_1.R50K_TOKEN_SPLIT_REGEX,
        bytePairRankDecoder,
        specialTokensEncoder: new Map([[specialTokens_js_1.EndOfText, 50_256]]),
    };
}
//# sourceMappingURL=p50k_base.js.map