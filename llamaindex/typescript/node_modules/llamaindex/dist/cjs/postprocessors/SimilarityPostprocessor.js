"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SimilarityPostprocessor", {
    enumerable: true,
    get: function() {
        return SimilarityPostprocessor;
    }
});
class SimilarityPostprocessor {
    similarityCutoff;
    constructor(options){
        this.similarityCutoff = options?.similarityCutoff;
    }
    async postprocessNodes(nodes) {
        if (this.similarityCutoff === undefined) return nodes;
        const cutoff = this.similarityCutoff || 0;
        return nodes.filter((node)=>node.score && node.score >= cutoff);
    }
}
