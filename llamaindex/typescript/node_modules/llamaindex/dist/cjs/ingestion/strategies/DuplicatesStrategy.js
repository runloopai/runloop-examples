"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DuplicatesStrategy", {
    enumerable: true,
    get: function() {
        return DuplicatesStrategy;
    }
});
const _rollback = require("./rollback.js");
class DuplicatesStrategy extends _rollback.RollbackableTransformComponent {
    docStore;
    constructor(docStore){
        super(async (nodes)=>{
            const hashes = await this.docStore.getAllDocumentHashes();
            const currentHashes = new Set();
            const nodesToRun = [];
            for (const node of nodes){
                if (!(node.hash in hashes) && !currentHashes.has(node.hash)) {
                    await this.docStore.setDocumentHash(node.id_, node.hash);
                    nodesToRun.push(node);
                    currentHashes.add(node.hash);
                }
            }
            await this.docStore.addDocuments(nodesToRun, true);
            return nodesToRun;
        });
        this.docStore = docStore;
    }
}
