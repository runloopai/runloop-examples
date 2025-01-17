import { RetrieverQueryEngine } from "../engines/query/RetrieverQueryEngine.js";
import { LlamaCloudRetriever } from "./LlamaCloudRetriever.js";
import { getAppBaseUrl, getPipelineId, getProjectId, initService } from "./utils.js";
import { createBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPost, deletePipelineDocumentApiV1PipelinesPipelineIdDocumentsDocumentIdDelete, getPipelineDocumentStatusApiV1PipelinesPipelineIdDocumentsDocumentIdStatusGet, getPipelineStatusApiV1PipelinesPipelineIdStatusGet, searchPipelinesApiV1PipelinesGet, upsertBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPut, upsertPipelineApiV1PipelinesPut } from "@llamaindex/cloud/api";
import { getEnv } from "@llamaindex/env";
import { Settings } from "../Settings.js";
export class LlamaCloudIndex {
    params;
    constructor(params){
        this.params = params;
        initService(this.params);
    }
    async waitForPipelineIngestion(verbose = Settings.debug, raiseOnError = false) {
        const pipelineId = await this.getPipelineId();
        if (verbose) {
            console.log("Waiting for pipeline ingestion: ");
        }
        while(true){
            const { data: pipelineStatus } = await getPipelineStatusApiV1PipelinesPipelineIdStatusGet({
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
    async waitForDocumentIngestion(docIds, verbose = Settings.debug, raiseOnError = false) {
        const pipelineId = await this.getPipelineId();
        if (verbose) {
            console.log("Loading data: ");
        }
        const pendingDocs = new Set(docIds);
        while(pendingDocs.size){
            const docsToRemove = new Set();
            for (const doc of pendingDocs){
                const { data: { status } } = await getPipelineDocumentStatusApiV1PipelinesPipelineIdDocumentsDocumentIdStatusGet({
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
        return await getPipelineId(name ?? this.params.name, projectName ?? this.params.projectName, organizationId ?? this.params.organizationId);
    }
    async getProjectId(projectName, organizationId) {
        return await getProjectId(projectName ?? this.params.projectName, organizationId ?? this.params.organizationId);
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
        const apiUrl = getAppBaseUrl();
        const projectId = await this.getProjectId();
        const pipelineId = await this.getPipelineId();
        await upsertBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPut({
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
            const { data: pipelineStatus } = await getPipelineStatusApiV1PipelinesPipelineIdStatusGet({
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
        return new LlamaCloudRetriever({
            ...this.params,
            ...params
        });
    }
    asQueryEngine(params) {
        const retriever = new LlamaCloudRetriever({
            ...this.params,
            ...params
        });
        return new RetrieverQueryEngine(retriever, params?.responseSynthesizer, params?.nodePostprocessors);
    }
    async insert(document) {
        const pipelineId = await this.getPipelineId();
        await createBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPost({
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
        await deletePipelineDocumentApiV1PipelinesPipelineIdDocumentsDocumentIdDelete({
            path: {
                pipeline_id: pipelineId,
                document_id: document.id_
            }
        });
        await this.waitForPipelineIngestion();
    }
    async refreshDoc(document) {
        const pipelineId = await this.getPipelineId();
        await upsertBatchPipelineDocumentsApiV1PipelinesPipelineIdDocumentsPut({
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
        const { data: pipelines } = await searchPipelinesApiV1PipelinesGet({
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
                const openAIApiKey = getEnv("OPENAI_API_KEY");
                const embeddingModel = getEnv("EMBEDDING_MODEL");
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
            const { data: pipeline } = await upsertPipelineApiV1PipelinesPut({
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
