"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R50KBase = R50KBase;
const specialTokens_js_1 = require("../specialTokens.js");
const constants_js_1 = require("./constants.js");
function R50KBase(bytePairRankDecoder) {
    return {
        expectedVocabularySize: 50_257,
        tokenSplitRegex: constants_js_1.R50K_TOKEN_SPLIT_REGEX,
        bytePairRankDecoder,
        specialTokensEncoder: new Map([[specialTokens_js_1.EndOfText, 50_256]]),
    };
}
//# sourceMappingURL=r50k_base.js.map