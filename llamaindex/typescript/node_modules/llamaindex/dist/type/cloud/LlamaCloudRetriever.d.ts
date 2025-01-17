import { type MetadataFilters, type RetrievalParams } from "@llamaindex/cloud/api";
import type { QueryBundle } from "@llamaindex/core/query-engine";
import { BaseRetriever } from "@llamaindex/core/retriever";
import type { NodeWithScore } from "@llamaindex/core/schema";
import type { ClientParams, CloudConstructorParams } from "./type.js";
export type CloudRetrieveParams = Omit<RetrievalParams, "query" | "search_filters" | "dense_similarity_top_k"> & {
    similarityTopK?: number;
    filters?: MetadataFilters;
};
export declare class LlamaCloudRetriever extends BaseRetriever {
    clientParams: ClientParams;
    retrieveParams: CloudRetrieveParams;
    organizationId?: string;
    projectName: string;
    pipelineName: string;
    private resultNodesToNodeWithScore;
    private convertFilter;
    constructor(params: CloudConstructorParams & CloudRetrieveParams);
    _retrieve(query: QueryBundle): Promise<NodeWithScore[]>;
}
