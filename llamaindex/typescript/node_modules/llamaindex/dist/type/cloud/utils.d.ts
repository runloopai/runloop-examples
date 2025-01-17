import type { ClientParams } from "./type.js";
export declare function getAppBaseUrl(): string;
export declare function initService({ apiKey, baseUrl }?: ClientParams): void;
export declare function getProjectId(projectName: string, organizationId?: string): Promise<string>;
export declare function getPipelineId(name: string, projectName: string, organizationId?: string): Promise<string>;
