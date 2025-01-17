"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LlamaCloudRetriever", {
    enumerable: true,
    get: function() {
        return LlamaCloudRetriever;
    }
});
const _api = require("@llamaindex/cloud/api");
const _global = require("@llamaindex/core/global");
const _retriever = require("@llamaindex/core/retriever");
const _schema = require("@llamaindex/core/schema");
const _utils = require("@llamaindex/core/utils");
const _utils1 = require("./utils.js");
class LlamaCloudRetriever extends _retriever.BaseRetriever {
    clientParams;
    retrieveParams;
    organizationId;
    projectName = _global.DEFAULT_PROJECT_NAME;
    pipelineName;
    resultNodesToNodeWithScore(nodes) {
        return nodes.map((node)=>{
            const textNode = (0, _schema.jsonToNode)(node.node, _schema.ObjectType.TEXT);
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
        (0, _utils1.initService)(this.clientParams);
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
        const pipelineId = await (0, _utils1.getPipelineId)(this.pipelineName, this.projectName, this.organizationId);
        const filters = this.convertFilter(this.retrieveParams.filters);
        const { data: results } = await (0, _api.runSearchApiV1PipelinesPipelineIdRetrievePost)({
            throwOnError: true,
            path: {
                pipeline_id: pipelineId
            },
            body: {
                ...this.retrieveParams,
                query: (0, _utils.extractText)(query),
                search_filters: filters,
                dense_similarity_top_k: this.retrieveParams.similarityTopK
            }
        });
        return this.resultNodesToNodeWithScore(results.retrieval_nodes);
    }
}
