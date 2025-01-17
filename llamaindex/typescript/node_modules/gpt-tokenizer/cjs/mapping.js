"use strict";
/* eslint-disable camelcase */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatEnabledModelsList = exports.chatModelParams = exports.modelToEncodingMap = exports.encodingNames = exports.o200k_base = exports.r50k_base = exports.p50k_edit = exports.p50k_base = exports.cl100k_base = void 0;
const models_js_1 = require("./models.js");
const specialTokens_js_1 = require("./specialTokens.js");
exports.cl100k_base = 'cl100k_base';
exports.p50k_base = 'p50k_base';
exports.p50k_edit = 'p50k_edit';
exports.r50k_base = 'r50k_base';
exports.o200k_base = 'o200k_base';
exports.encodingNames = [
    exports.p50k_base,
    exports.r50k_base,
    exports.p50k_edit,
    exports.cl100k_base,
    exports.o200k_base,
];
const chatEnabledModelsMap = Object.fromEntries(Object.entries(models_js_1.chatEnabledModels).map(([modelName, data]) => [
    modelName,
    data.encoding,
]));
exports.modelToEncodingMap = Object.fromEntries(Object.entries(models_js_1.models).map(([modelName, data]) => [modelName, data.encoding]));
const gpt3params = {
    messageSeparator: '\n',
    roleSeparator: '\n',
};
const gpt4params = {
    messageSeparator: '',
    roleSeparator: specialTokens_js_1.ImSep,
};
exports.chatModelParams = Object.fromEntries(Object.keys(chatEnabledModelsMap).flatMap((modelName) => modelName.startsWith('gpt-4')
    ? [[modelName, gpt4params]]
    : modelName.startsWith('gpt-3.5-turbo')
        ? [[modelName, gpt3params]]
        : []));
exports.chatEnabledModelsList = Object.keys(chatEnabledModelsMap);
//# sourceMappingURL=mapping.js.map