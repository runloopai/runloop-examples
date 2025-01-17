"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncodingParams = getEncodingParams;
const cl100k_base_js_1 = require("./encodingParams/cl100k_base.js");
const o200k_base_js_1 = require("./encodingParams/o200k_base.js");
const p50k_base_js_1 = require("./encodingParams/p50k_base.js");
const p50k_edit_js_1 = require("./encodingParams/p50k_edit.js");
const r50k_base_js_1 = require("./encodingParams/r50k_base.js");
function getEncodingParams(encodingName, getMergeableRanks) {
    const mergeableBytePairRanks = getMergeableRanks(encodingName);
    switch (encodingName.toLowerCase()) {
        case 'r50k_base':
            return (0, r50k_base_js_1.R50KBase)(mergeableBytePairRanks);
        case 'p50k_base':
            return (0, p50k_base_js_1.P50KBase)(mergeableBytePairRanks);
        case 'p50k_edit':
            return (0, p50k_edit_js_1.P50KEdit)(mergeableBytePairRanks);
        case 'cl100k_base':
            return (0, cl100k_base_js_1.Cl100KBase)(mergeableBytePairRanks);
        case 'o200k_base':
            return (0, o200k_base_js_1.O200KBase)(mergeableBytePairRanks);
        default:
            throw new Error(`Unknown encoding name: ${encodingName}`);
    }
}
//# sourceMappingURL=modelParams.js.map