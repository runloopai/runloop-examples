"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxValueFromMap = getMaxValueFromMap;
exports.escapeRegExp = escapeRegExp;
exports.getSpecialTokenRegex = getSpecialTokenRegex;
function getMaxValueFromMap(map) {
    let max = 0;
    map.forEach((val) => {
        max = Math.max(max, val);
    });
    return max;
}
function escapeRegExp(string) {
    return string.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&'); // $& means the whole matched string
}
function getSpecialTokenRegex(tokens) {
    const escapedTokens = [...tokens].map(escapeRegExp);
    const inner = escapedTokens.join('|');
    return new RegExp(`(${inner})`);
}
//# sourceMappingURL=util.js.map