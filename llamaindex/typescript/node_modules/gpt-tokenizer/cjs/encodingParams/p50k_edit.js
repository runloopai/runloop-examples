"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P50KEdit = P50KEdit;
const specialTokens_js_1 = require("../specialTokens.js");
const constants_js_1 = require("./constants.js");
function P50KEdit(bytePairRankDecoder) {
    const specialTokenMapping = new Map([
        [specialTokens_js_1.EndOfText, 50_256],
        [specialTokens_js_1.FimPrefix, 50_281],
        [specialTokens_js_1.FimMiddle, 50_282],
        [specialTokens_js_1.FimSuffix, 50_283],
    ]);
    return {
        tokenSplitRegex: constants_js_1.R50K_TOKEN_SPLIT_REGEX,
        bytePairRankDecoder,
        specialTokensEncoder: specialTokenMapping,
    };
}
//# sourceMappingURL=p50k_edit.js.map