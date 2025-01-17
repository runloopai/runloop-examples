"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpsertsAndDeleteStrategy", {
    enumerable: true,
    get: function() {
        return UpsertsAndDeleteStrategy;
    }
});
const _classify = require("./classify.js");
const _rollback = require("./rollback.js");
class UpsertsAndDeleteStrategy extends _rollback.RollbackableTransformComponent {
    docStore;
    vectorStores;
    constructor(docStore, vectorStores){
        super(async (nodes)=>{
            const { dedupedNodes, missingDocs, unusedDocs } = await (0, _classify.classify)(this.docStore, nodes);
            // remove unused docs
            for (const refDocId of unusedDocs){
                await this.docStore.deleteRefDoc(refDocId, false);
                if (this.vectorStores) {
                    for (const vectorStore of this.vectorStores){
                        await vectorStore.delete(refDocId);
                    }
                }
            }
            // remove missing docs
            for (const docId of missingDocs){
                await this.docStore.deleteDocument(docId, true);
                if (this.vectorStores) {
                    for (const vectorStore of this.vectorStores){
                        await vectorStore.delete(docId);
                    }
                }
            }
            await this.docStore.addDocuments(dedupedNodes, true);
            return dedupedNodes;
        });
        this.docStore = docStore;
        this.vectorStores = vectorStores;
    }
}
