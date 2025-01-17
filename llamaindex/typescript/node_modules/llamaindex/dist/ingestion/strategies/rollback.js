import { TransformComponent } from "@llamaindex/core/schema";
import { classify } from "./classify.js";
export class RollbackableTransformComponent extends TransformComponent {
    // Remove unused docs from the doc store. It is useful in case
    // generating embeddings fails and we want to remove the unused docs
    // TODO: override this in UpsertsStrategy if we want to revert removed docs also
    async rollback(docStore, nodes) {
        const { unusedDocs } = await classify(docStore, nodes);
        for (const docId of unusedDocs){
            await docStore.deleteDocument(docId, false);
        }
        docStore.persist();
    }
}
