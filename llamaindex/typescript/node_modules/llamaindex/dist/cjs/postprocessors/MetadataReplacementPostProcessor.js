"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MetadataReplacementPostProcessor", {
    enumerable: true,
    get: function() {
        return MetadataReplacementPostProcessor;
    }
});
const _schema = require("@llamaindex/core/schema");
class MetadataReplacementPostProcessor {
    targetMetadataKey;
    constructor(targetMetadataKey){
        this.targetMetadataKey = targetMetadataKey;
    }
    async postprocessNodes(nodes) {
        for (const n of nodes){
            n.node.setContent(n.node.metadata[this.targetMetadataKey] ?? n.node.getContent(_schema.MetadataMode.NONE));
        }
        return nodes;
    }
}
