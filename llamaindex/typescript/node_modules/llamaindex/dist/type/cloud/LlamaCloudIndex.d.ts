import type { BaseNodePostprocessor } from "@llamaindex/core/postprocessor";
import type { BaseQueryEngine } from "@llamaindex/core/query-engine";
import type { BaseSynthesizer } from "@llamaindex/core/response-synthesizers";
import type { Document } from "@llamaindex/core/schema";
import type { CloudRetrieveParams } from "./LlamaCloudRetriever.js";
import type { CloudConstructorParams } from "./type.js";
import { type PipelineCreate } from "@llamaindex/cloud/api";
import type { BaseRetriever } from "@llamaindex/core/retriever";
export declare class LlamaCloudIndex {
    params: CloudConstructorParams;
    constructor(params: CloudConstructorParams);
    private waitForPipelineIngestion;
    private waitForDocumentIngestion;
    getPipelineId(name?: string, projectName?: string, organizationId?: string): Promise<string>;
    getProjectId(projectName?: string, organizationId?: string): Promise<string>;
    /**
     * Adds documents to the given index parameters. If the index does not exist, it will be created.
     *
     * @param params - An object containing the following properties:
     *   - documents: An array of Document objects to be added to the index.
     *   - verbose: Optional boolean to enable verbose logging.
     *   - Additional properties from CloudConstructorParams.
     * @returns A Promise that resolves to a new LlamaCloudIndex instance.
     */
    static fromDocuments(params: {
        documents: Document[];
        verbose?: boolean;
    } & CloudConstructorParams, config?: {
        embedding: PipelineCreate["embedding_config"];
        transform: PipelineCreate["transform_config"];
    }): Promise<LlamaCloudIndex>;
    addDocuments(documents: Document[], verbose?: boolean): Promise<void>;
    asRetriever(params?: CloudRetrieveParams): BaseRetriever;
    asQueryEngine(params?: {
        responseSynthesizer?: BaseSynthesizer;
        preFilters?: unknown;
        nodePostprocessors?: BaseNodePostprocessor[];
    } & CloudRetrieveParams): BaseQueryEngine;
    insert(document: Document): Promise<void>;
    delete(document: Document): Promise<void>;
    refreshDoc(document: Document): Promise<void>;
    ensureIndex(config?: {
        embedding?: PipelineCreate["embedding_config"];
        transform?: PipelineCreate["transform_config"];
        verbose?: boolean;
    }): Promise<void>;
}
