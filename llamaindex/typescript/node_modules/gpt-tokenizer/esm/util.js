export function getMaxValueFromMap(map) {
    let max = 0;
    map.forEach((val) => {
        max = Math.max(max, val);
    });
    return max;
}
export function escapeRegExp(string) {
    return string.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&'); // $& means the whole matched string
}
export function getSpecialTokenRegex(tokens) {
    const escapedTokens = [...tokens].map(escapeRegExp);
    const inner = escapedTokens.join('|');
    return new RegExp(`(${inner})`);
}
//# sourceMappingURL=util.js.map