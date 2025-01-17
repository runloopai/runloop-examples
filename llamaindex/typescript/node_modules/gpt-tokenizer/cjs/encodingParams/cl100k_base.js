"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cl100KBase = Cl100KBase;
const specialTokens_js_1 = require("../specialTokens.js");
const constants_js_1 = require("./constants.js");
function Cl100KBase(bytePairRankDecoder) {
    const specialTokenMapping = new Map([
        [specialTokens_js_1.EndOfText, 100_257],
        [specialTokens_js_1.FimPrefix, 100_258],
        [specialTokens_js_1.FimMiddle, 100_259],
        [specialTokens_js_1.FimSuffix, 100_260],
        [specialTokens_js_1.ImStart, 100_264],
        [specialTokens_js_1.ImEnd, 100_265],
        [specialTokens_js_1.ImSep, 100_266],
        [specialTokens_js_1.EndOfPrompt, 100_276],
    ]);
    return {
        tokenSplitRegex: constants_js_1.CL_AND_O_TOKEN_SPLIT_PATTERN,
        bytePairRankDecoder,
        specialTokensEncoder: specialTokenMapping,
    };
}
//# sourceMappingURL=cl100k_base.js.map