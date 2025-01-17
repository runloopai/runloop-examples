"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    expandTokensWithSubtokens: function() {
        return expandTokensWithSubtokens;
    },
    extractKeywordsGivenResponse: function() {
        return extractKeywordsGivenResponse;
    },
    rakeExtractKeywords: function() {
        return rakeExtractKeywords;
    },
    simpleExtractKeywords: function() {
        return simpleExtractKeywords;
    }
});
const _rakemodified = /*#__PURE__*/ _interop_require_default(require("../../internal/deps/rake-modified.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function expandTokensWithSubtokens(tokens) {
    const results = new Set();
    const regex = /\w+/g;
    for (const token of tokens){
        results.add(token);
        const subTokens = token.match(regex);
        if (subTokens && subTokens.length > 1) {
            for (const w of subTokens){
                results.add(w);
            }
        }
    }
    return results;
}
function extractKeywordsGivenResponse(response, startToken = "", lowercase = true) {
    const results = [];
    response = response.trim();
    if (response.startsWith(startToken)) {
        response = response.substring(startToken.length);
    }
    const keywords = response.split(",");
    for (const k of keywords){
        let rk = k;
        if (lowercase) {
            rk = rk.toLowerCase();
        }
        results.push(rk.trim());
    }
    return expandTokensWithSubtokens(new Set(results));
}
function simpleExtractKeywords(textChunk, maxKeywords) {
    const regex = /\w+/g;
    const tokens = [
        ...textChunk.matchAll(regex)
    ].map((token)=>token[0].toLowerCase().trim());
    // Creating a frequency map
    const valueCounts = {};
    for (const token of tokens){
        valueCounts[token] = (valueCounts[token] || 0) + 1;
    }
    // Sorting tokens by frequency
    const sortedTokens = Object.keys(valueCounts).sort((a, b)=>valueCounts[b] - valueCounts[a]);
    const keywords = maxKeywords ? sortedTokens.slice(0, maxKeywords) : sortedTokens;
    return new Set(keywords);
}
function rakeExtractKeywords(textChunk, maxKeywords) {
    const keywords = Object.keys((0, _rakemodified.default)(textChunk));
    const limitedKeywords = maxKeywords ? keywords.slice(0, maxKeywords) : keywords;
    return new Set(limitedKeywords);
}
