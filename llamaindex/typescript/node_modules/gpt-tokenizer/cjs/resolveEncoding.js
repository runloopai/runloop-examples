"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEncoding = void 0;
/* eslint-disable import/extensions */
const cl100k_base_js_1 = __importDefault(require("./bpeRanks/cl100k_base.js"));
const o200k_base_js_1 = __importDefault(require("./bpeRanks/o200k_base.js"));
const p50k_base_js_1 = __importDefault(require("./bpeRanks/p50k_base.js"));
const r50k_base_js_1 = __importDefault(require("./bpeRanks/r50k_base.js"));
const resolveEncoding = (encoding) => {
    switch (encoding) {
        case 'r50k_base':
            return r50k_base_js_1.default;
        case 'p50k_base':
        case 'p50k_edit':
            return p50k_base_js_1.default;
        case 'cl100k_base':
            return cl100k_base_js_1.default;
        case 'o200k_base':
            return o200k_base_js_1.default;
        default: {
            throw new Error(`Unknown encoding name: ${encoding}`);
        }
    }
};
exports.resolveEncoding = resolveEncoding;
//# sourceMappingURL=resolveEncoding.js.map