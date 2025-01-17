import { chatEnabledModels, models } from './models.js';
export declare const cl100k_base = "cl100k_base";
export declare const p50k_base = "p50k_base";
export declare const p50k_edit = "p50k_edit";
export declare const r50k_base = "r50k_base";
export declare const o200k_base = "o200k_base";
export declare const encodingNames: readonly ["p50k_base", "r50k_base", "p50k_edit", "cl100k_base", "o200k_base"];
export type EncodingName = (typeof encodingNames)[number];
declare const chatEnabledModelsMap: Record<keyof typeof chatEnabledModels, EncodingName>;
export declare const modelToEncodingMap: Record<keyof typeof models, EncodingName>;
export interface ChatParameters {
    messageSeparator: string;
    roleSeparator: string;
}
export type ModelName = keyof typeof modelToEncodingMap;
export type ChatModelName = keyof typeof chatEnabledModelsMap;
export declare const chatModelParams: Record<ChatModelName, ChatParameters>;
export declare const chatEnabledModelsList: ChatModelName[];
export {};
