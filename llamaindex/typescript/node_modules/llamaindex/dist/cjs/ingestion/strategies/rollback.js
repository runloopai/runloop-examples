"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RollbackableTransformComponent", {
    enumerable: true,
    get: function() {
        return RollbackableTransformComponent;
    }
});
const _schema = require("@llamaindex/core/schema");
const _classify = require("./classify.js");
class RollbackableTransformComponent extends _schema.TransformComponent {
    // Remove unused docs from the doc store. It is useful in case
    // generating embeddings fails and we want to remove the unused docs
    // TODO: override this in UpsertsStrategy if we want to revert removed docs also
    async rollback(docStore, nodes) {
        const { unusedDocs } = await (0, _classify.classify)(docStore, nodes);
        for (const docId of unusedDocs){
            await docStore.deleteDocument(docId, false);
        }
        docStore.persist();
    }
}
