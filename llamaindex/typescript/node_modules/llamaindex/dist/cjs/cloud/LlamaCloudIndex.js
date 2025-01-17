"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LlamaCloudIndex", {
    enumerable: true,
    get: function() {
        return LlamaCloudIndex;
    }
});
const _RetrieverQueryEngine = require("../engines/query/RetrieverQueryEngine.js");
const _LlamaCloudRetriever = require("./LlamaCloudRetriever.js");
const _utils = require("./utils.js");
const _api = require("@llamaindex/cloud/api");
const _env = require("@llamaindex/env");
const _Settings = require("../Settings.js");
class LlamaCloudIndex {
    params;
    constructor(params){
        this.params = params;
        (0, _utils.initService)(this.params);
    }
    async waitForPipelineIngestion(verbose = _Settings.Settings.debug, raiseOnError = false) {
        const pipelineId = await this.getPipelineId();
        if (verbose) {
            console.log("Waiting for pipeline ingestion: ");
        }
        while(true){
            const { data: pipelineStatus } = await (0, _api.getPipelineStatusApiV1PipelinesPipelineIdStatusGet)({
                path: {
                    pipeline_id: pipelineId
                },
                throwOnError: true
            });
            if (pipelineStatus.status === "SUCCESS") {
                if (verbose) {
                    console.log("Pipeline ingestion completed successfully");
                }
                break;
            }
            if (pipelineStatus.status === "ERROR") {
                if (verbose) {
                    console.error("Pipeline ingestion failed");
                }
                if (raiseOnError) {
                    throw new Error("Pipeline ingestion failed");
                }
            }
            if (verbose) {
                process.stdout.write(".");
            }
            await new Promise((resolve)=>setTimeout(resolve, 1000));
        }
    }
    async waitForDocumentIngestion(docIds, verbose = _Settings.Settings.debug, raiseOnError = false) {
        const pipelineId = await this.getPipelineId();
        if (verbose) {
            console.log("Loading data: ");
        }
        const pendingDocs = new Set(docIds);
        while(pendingDocs.size){
            const docsToRemove = new Set();
            for (const doc of pendingDocs){
                const { data: { status } } = await (0, _api.getPipelineDocumentStatusApiV1PipelinesPipelineIdDocumentsDocumentIdStatusGet)({
                    path: {
                        pipeline_id: pipelineId,
                        document_id: doc
                    },
                    throwOnError: true
                });
                if (status === "NOT_STARTED" || status === "IN_PROGRESS") {
                    continue;
                }
                if (status === "ERROR") {
                    if (verbose) {
                        console.error(`Document ingestion failed for ${doc}`);
                    }
                    if (raiseOnError) {
                        throw new Error(`Document ingestion failed for ${doc}`);
                    }
                }
                docsToRemove.add(doc);
            }
            for (const doc of docsToRemove){
                pendingDocs.delete(doc);
            }
            if (pendingDocs.size) {
                if (verbose) {
                    process.stdout.write(".");
                }
                await new Promise((resolve)=>setTimeout(resolve, 500));
            }
        }
        if (verbose) {
            console.log("Done!");
        }
        await this.waitForPipelineIngestion(verbose, raiseOnError);
    }
    async getPipelineId(name, projectName, organizationId) {
        return await (0, _utils.getPipelineId)(name ?? this.params.name, projectName ?? this.params.projectName, organizationId ?? this.params.organizationId);
    }
    async getProjectId(projectName, organizationId) {
        return await (0, _utils.getProjectId)(projectName ?? this.params.projectName, organizationId ?? this.params.organizationId);
    }
    /**
   * Adds documents to the given index parameters. If the index does not exist, it will be created.
   *
   * @param params - An object containing the following properties:
   *   - documents: An array of Document objects to be added to the index.
   *   - verbose: Optional boolean to enable verbose logging.
   *   - Additional properties from CloudConstructorParams.
   * @returns A Promise that resolves to a new LlamaCloudIndex instance.
   */ static async fromDocuments(params, config) {
        const index = new LlamaCloudIndex({
            ...params
        });
        await index.ensureIndex({
            ...config,
            verbose: params.verbose ?? false
        });
        await index.addDocuments(params.documents, params.verbose);
        return index;
    }
    async addDocuments(documents, verbose) {
        const apiUrl = (0, _utils.getAppBaseUrl)();
        const projectId = await this.getProjectId();
        const pipelineId = await this.getPipelineId();
        await (0, _api.upsertBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPut)({
            path: {
                pipeline_id: pipelineId
            },
            body: documents.map((doc)=>({
                    metadata: doc.metadata,
                    text: doc.text,
                    excluded_embed_metadata_keys: doc.excludedEmbedMetadataKeys,
                    excluded_llm_metadata_keys: doc.excludedEmbedMetadataKeys,
                    id: doc.id_
                }))
        });
        while(true){
            const { data: pipelineStatus } = await (0, _api.getPipelineStatusApiV1PipelinesPipelineIdStatusGet)({
                path: {
                    pipeline_id: pipelineId
                },
                throwOnError: true
            });
            if (pipelineStatus.status === "SUCCESS") {
                console.info("Documents ingested successfully, pipeline is ready to use");
                break;
            }
            if (pipelineStatus.status === "ERROR") {
                console.error(`Some documents failed to ingest, check your pipeline logs at ${apiUrl}/project/${projectId}/deploy/${pipelineId}`);
                throw new Error("Some documents failed to ingest");
            }
            if (pipelineStatus.status === "PARTIAL_SUCCESS") {
                console.info(`Documents ingestion partially succeeded, to check a more complete status check your pipeline at ${apiUrl}/project/${projectId}/deploy/${pipelineId}`);
                break;
            }
            if (verbose) {
                process.stdout.write(".");
            }
            await new Promise((resolve)=>setTimeout(resolve, 1000));
        }
        if (verbose) {
            console.info(`Ingestion completed, find your index at ${apiUrl}/project/${projectId}/deploy/${pipelineId}`);
        }
    }
    asRetriever(params = {}) {
        return new _LlamaCloudRetriever.LlamaCloudRetriever({
            ...this.params,
            ...params
        });
    }
    asQueryEngine(params) {
        const retriever = new _LlamaCloudRetriever.LlamaCloudRetriever({
            ...this.params,
            ...params
        });
        return new _RetrieverQueryEngine.RetrieverQueryEngine(retriever, params?.responseSynthesizer, params?.nodePostprocessors);
    }
    async insert(document) {
        const pipelineId = await this.getPipelineId();
        await (0, _api.createBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPost)({
            path: {
                pipeline_id: pipelineId
            },
            body: [
                {
                    metadata: document.metadata,
                    text: document.text,
                    excluded_embed_metadata_keys: document.excludedLlmMetadataKeys,
                    excluded_llm_metadata_keys: document.excludedEmbedMetadataKeys,
                    id: document.id_
                }
            ]
        });
        await this.waitForDocumentIngestion([
            document.id_
        ]);
    }
    async delete(document) {
        const pipelineId = await this.getPipelineId();
        await (0, _api.deletePipelineDocumentApiV1PipelinesPipelineIdDocumentsDocumentIdDelete)({
            path: {
                pipeline_id: pipelineId,
                document_id: document.id_
            }
        });
        await this.waitForPipelineIngestion();
    }
    async refreshDoc(document) {
        const pipelineId = await this.getPipelineId();
        await (0, _api.upsertBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPut)({
            path: {
                pipeline_id: pipelineId
            },
            body: [
                {
                    metadata: document.metadata,
                    text: document.text,
                    excluded_embed_metadata_keys: document.excludedLlmMetadataKeys,
                    excluded_llm_metadata_keys: document.excludedEmbedMetadataKeys,
                    id: document.id_
                }
            ]
        });
        await this.waitForDocumentIngestion([
            document.id_
        ]);
    }
    async ensureIndex(config) {
        const projectId = await this.getProjectId();
        const { data: pipelines } = await (0, _api.searchPipelinesApiV1PipelinesGet)({
            query: {
                project_id: projectId,
                pipeline_name: this.params.name
            },
            throwOnError: true
        });
        if (pipelines.length === 0) {
            // no pipeline found, create a new one
            let embeddingConfig = config?.embedding;
            if (!embeddingConfig) {
                // no embedding config provided, use OpenAI as default
                const openAIApiKey = (0, _env.getEnv)("OPENAI_API_KEY");
                const embeddingModel = (0, _env.getEnv)("EMBEDDING_MODEL");
                if (!openAIApiKey || !embeddingModel) {
                    throw new Error("No embedding configuration provided. Fallback to OpenAI embedding model. OPENAI_API_KEY and EMBEDDING_MODEL environment variables must be set.");
                }
                embeddingConfig = {
                    type: "OPENAI_EMBEDDING",
                    component: {
                        api_key: openAIApiKey,
                        model_name: embeddingModel
                    }
                };
            }
            let transformConfig = config?.transform;
            if (!transformConfig) {
                transformConfig = {
                    mode: "auto",
                    chunk_size: 1024,
                    chunk_overlap: 200
                };
            }
            const { data: pipeline } = await (0, _api.upsertPipelineApiV1PipelinesPut)({
                query: {
                    project_id: projectId
                },
                body: {
                    name: this.params.name,
                    embedding_config: embeddingConfig,
                    transform_config: transformConfig
                },
                throwOnError: true
            });
            if (config?.verbose) {
                console.log(`Created pipeline ${pipeline.id} with name ${pipeline.name}`);
            }
        }
    }
}
