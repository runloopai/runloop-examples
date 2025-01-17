import { MetadataMode } from "@llamaindex/core/schema";
export class MetadataReplacementPostProcessor {
    targetMetadataKey;
    constructor(targetMetadataKey){
        this.targetMetadataKey = targetMetadataKey;
    }
    async postprocessNodes(nodes) {
        for (const n of nodes){
            n.node.setContent(n.node.metadata[this.targetMetadataKey] ?? n.node.getContent(MetadataMode.NONE));
        }
        return nodes;
    }
}
