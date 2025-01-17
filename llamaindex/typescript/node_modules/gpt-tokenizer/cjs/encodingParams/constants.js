"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CL_AND_O_TOKEN_SPLIT_PATTERN = exports.R50K_TOKEN_SPLIT_REGEX = void 0;
exports.R50K_TOKEN_SPLIT_REGEX = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
exports.CL_AND_O_TOKEN_SPLIT_PATTERN = /(?:'s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/giu;
//# sourceMappingURL=constants.js.map