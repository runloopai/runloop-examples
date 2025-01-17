import { classify } from "./classify.js";
import { RollbackableTransformComponent } from "./rollback.js";
/**
 * Handles doc store upserts by checking hashes and ids.
 */ export class UpsertsStrategy extends RollbackableTransformComponent {
    docStore;
    vectorStores;
    constructor(docStore, vectorStores){
        super(async (nodes)=>{
            const { dedupedNodes, unusedDocs } = await classify(this.docStore, nodes);
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
