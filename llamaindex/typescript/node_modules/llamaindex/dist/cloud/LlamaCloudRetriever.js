import { runSearchApiV1PipelinesPipelineIdRetrievePost } from "@llamaindex/cloud/api";
import { DEFAULT_PROJECT_NAME } from "@llamaindex/core/global";
import { BaseRetriever } from "@llamaindex/core/retriever";
import { jsonToNode, ObjectType } from "@llamaindex/core/schema";
import { extractText } from "@llamaindex/core/utils";
import { getPipelineId, initService } from "./utils.js";
export class LlamaCloudRetriever extends BaseRetriever {
    clientParams;
    retrieveParams;
    organizationId;
    projectName = DEFAULT_PROJECT_NAME;
    pipelineName;
    resultNodesToNodeWithScore(nodes) {
        return nodes.map((node)=>{
            const textNode = jsonToNode(node.node, ObjectType.TEXT);
            textNode.metadata = {
                ...textNode.metadata,
                ...node.node.extra_info
            };
            return {
                // Currently LlamaCloud only supports text nodes
                node: textNode,
                score: node.score ?? undefined
            };
        });
    }
    // LlamaCloud expects null values for filters, but LlamaIndexTS uses undefined for empty values
    // This function converts the undefined values to null
    convertFilter(filters) {
        if (!filters) return null;
        const processFilter = (filter)=>{
            if ("filters" in filter) {
                // type MetadataFilters
                return {
                    ...filter,
                    filters: filter.filters.map(processFilter)
                };
            }
            return {
                ...filter,
                value: filter.value ?? null
            };
        };
        return {
            ...filters,
            filters: filters.filters.map(processFilter)
        };
    }
    constructor(params){
        super();
        this.clientParams = {
            apiKey: params.apiKey,
            baseUrl: params.baseUrl
        };
        initService(this.clientParams);
        this.retrieveParams = params;
        this.pipelineName = params.name;
        if (params.projectName) {
            this.projectName = params.projectName;
        }
        if (params.organizationId) {
            this.organizationId = params.organizationId;
        }
    }
    async _retrieve(query) {
        const pipelineId = await getPipelineId(this.pipelineName, this.projectName, this.organizationId);
        const filters = this.convertFilter(this.retrieveParams.filters);
        const { data: results } = await runSearchApiV1PipelinesPipelineIdRetrievePost({
            throwOnError: true,
            path: {
                pipeline_id: pipelineId
            },
            body: {
                ...this.retrieveParams,
                query: extractText(query),
                search_filters: filters,
                dense_similarity_top_k: this.retrieveParams.similarityTopK
            }
        });
        return this.resultNodesToNodeWithScore(results.retrieval_nodes);
    }
}
