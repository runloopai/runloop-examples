import { defaultNodeTextTemplate } from "@llamaindex/core/prompts";
import { MetadataMode, TextNode, TransformComponent } from "@llamaindex/core/schema";
/*
 * Abstract class for all extractors.
 */ export class BaseExtractor extends TransformComponent {
    isTextNodeOnly = true;
    showProgress = true;
    metadataMode = MetadataMode.ALL;
    disableTemplateRewrite = false;
    inPlace = true;
    numWorkers = 4;
    constructor(){
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        super(async (nodes, options)=>{
            return this.processNodes(nodes, options?.excludedEmbedMetadataKeys, options?.excludedLlmMetadataKeys);
        });
    }
    /**
   *
   * @param nodes Nodes to extract metadata from.
   * @param excludedEmbedMetadataKeys Metadata keys to exclude from the embedding.
   * @param excludedLlmMetadataKeys Metadata keys to exclude from the LLM.
   * @returns Metadata extracted from the nodes.
   */ async processNodes(nodes, excludedEmbedMetadataKeys = undefined, excludedLlmMetadataKeys = undefined) {
        let newNodes;
        if (this.inPlace) {
            newNodes = nodes;
        } else {
            newNodes = nodes.slice();
        }
        const curMetadataList = await this.extract(newNodes);
        for(const idx in newNodes){
            newNodes[idx].metadata = {
                ...newNodes[idx].metadata,
                ...curMetadataList[idx]
            };
        }
        for(const idx in newNodes){
            if (excludedEmbedMetadataKeys) {
                newNodes[idx].excludedEmbedMetadataKeys.concat(excludedEmbedMetadataKeys);
            }
            if (excludedLlmMetadataKeys) {
                newNodes[idx].excludedLlmMetadataKeys.concat(excludedLlmMetadataKeys);
            }
            if (!this.disableTemplateRewrite) {
                if (newNodes[idx] instanceof TextNode) {
                    newNodes[idx] = new TextNode({
                        ...newNodes[idx],
                        textTemplate: defaultNodeTextTemplate.format()
                    });
                }
            }
        }
        return newNodes;
    }
}
