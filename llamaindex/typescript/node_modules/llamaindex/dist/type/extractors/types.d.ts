import { BaseNode, MetadataMode, TransformComponent } from "@llamaindex/core/schema";
export declare abstract class BaseExtractor extends TransformComponent {
    isTextNodeOnly: boolean;
    showProgress: boolean;
    metadataMode: MetadataMode;
    disableTemplateRewrite: boolean;
    inPlace: boolean;
    numWorkers: number;
    constructor();
    abstract extract(nodes: BaseNode[]): Promise<Record<string, any>[]>;
    /**
     *
     * @param nodes Nodes to extract metadata from.
     * @param excludedEmbedMetadataKeys Metadata keys to exclude from the embedding.
     * @param excludedLlmMetadataKeys Metadata keys to exclude from the LLM.
     * @returns Metadata extracted from the nodes.
     */
    processNodes(nodes: BaseNode[], excludedEmbedMetadataKeys?: string[] | undefined, excludedLlmMetadataKeys?: string[] | undefined): Promise<BaseNode[]>;
}
