/* eslint-disable camelcase */
import { chatEnabledModels, models } from './models.js';
import { ImSep } from './specialTokens.js';
export const cl100k_base = 'cl100k_base';
export const p50k_base = 'p50k_base';
export const p50k_edit = 'p50k_edit';
export const r50k_base = 'r50k_base';
export const o200k_base = 'o200k_base';
export const encodingNames = [
    p50k_base,
    r50k_base,
    p50k_edit,
    cl100k_base,
    o200k_base,
];
const chatEnabledModelsMap = Object.fromEntries(Object.entries(chatEnabledModels).map(([modelName, data]) => [
    modelName,
    data.encoding,
]));
export const modelToEncodingMap = Object.fromEntries(Object.entries(models).map(([modelName, data]) => [modelName, data.encoding]));
const gpt3params = {
    messageSeparator: '\n',
    roleSeparator: '\n',
};
const gpt4params = {
    messageSeparator: '',
    roleSeparator: ImSep,
};
export const chatModelParams = Object.fromEntries(Object.keys(chatEnabledModelsMap).flatMap((modelName) => modelName.startsWith('gpt-4')
    ? [[modelName, gpt4params]]
    : modelName.startsWith('gpt-3.5-turbo')
        ? [[modelName, gpt3params]]
        : []));
export const chatEnabledModelsList = Object.keys(chatEnabledModelsMap);
//# sourceMappingURL=mapping.js.map