"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BaseExtractor", {
    enumerable: true,
    get: function() {
        return BaseExtractor;
    }
});
const _prompts = require("@llamaindex/core/prompts");
const _schema = require("@llamaindex/core/schema");
class BaseExtractor extends _schema.TransformComponent {
    isTextNodeOnly = true;
    showProgress = true;
    metadataMode = _schema.MetadataMode.ALL;
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
                if (newNodes[idx] instanceof _schema.TextNode) {
                    newNodes[idx] = new _schema.TextNode({
                        ...newNodes[idx],
                        textTemplate: _prompts.defaultNodeTextTemplate.format()
                    });
                }
            }
        }
        return newNodes;
    }
}
