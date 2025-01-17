"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEncodingAsync = void 0;
const resolveEncodingAsync = async (encoding) => {
    switch (encoding) {
        case 'r50k_base':
            return Promise.resolve().then(() => __importStar(require('./bpeRanks/r50k_base.js'))).then(({ default: rawBytePairRanks }) => rawBytePairRanks);
        case 'p50k_base':
        case 'p50k_edit':
            return Promise.resolve().then(() => __importStar(require('./bpeRanks/p50k_base.js'))).then(({ default: rawBytePairRanks }) => rawBytePairRanks);
        case 'cl100k_base':
            return Promise.resolve().then(() => __importStar(require('./bpeRanks/cl100k_base.js'))).then(({ default: rawBytePairRanks }) => rawBytePairRanks);
        case 'o200k_base':
            return Promise.resolve().then(() => __importStar(require('./bpeRanks/o200k_base.js'))).then(({ default: rawBytePairRanks }) => rawBytePairRanks);
        default: {
            throw new Error(`Unknown encoding name: ${encoding}`);
        }
    }
};
exports.resolveEncodingAsync = resolveEncodingAsync;
//# sourceMappingURL=resolveEncodingAsync.js.map