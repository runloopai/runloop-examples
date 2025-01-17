"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpsertsStrategy", {
    enumerable: true,
    get: function() {
        return UpsertsStrategy;
    }
});
const _classify = require("./classify.js");
const _rollback = require("./rollback.js");
class UpsertsStrategy extends _rollback.RollbackableTransformComponent {
    docStore;
    vectorStores;
    constructor(docStore, vectorStores){
        super(async (nodes)=>{
            const { dedupedNodes, unusedDocs } = await (0, _classify.classify)(this.docStore, nodes);
            // remove unused docs
            for (const refDocId of unusedDocs){
                await this.docStore.deleteRefDoc(refDocId, false);
                if (this.vectorStores) {
                    for (const vectorStore of this.vectorStores){
                        await vectorStore.delete(refDocId);
                    }
                }
            }
            // add non-duplicate docs
            await this.docStore.addDocuments(dedupedNodes, true);
            return dedupedNodes;
        });
        this.docStore = docStore;
        this.vectorStores = vectorStores;
    }
}
