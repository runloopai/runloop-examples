import { DuplicatesStrategy } from "./DuplicatesStrategy.js";
import { UpsertsAndDeleteStrategy } from "./UpsertsAndDeleteStrategy.js";
import { UpsertsStrategy } from "./UpsertsStrategy.js";
import { RollbackableTransformComponent } from "./rollback.js";
/**
 * Document de-deduplication strategies work by comparing the hashes or ids stored in the document store.
 * They require a document store to be set which must be persisted across pipeline runs.
 */ export var DocStoreStrategy = /*#__PURE__*/ function(DocStoreStrategy) {
    // Use upserts to handle duplicates. Checks if the a document is already in the doc store based on its id. If it is not, or if the hash of the document is updated, it will update the document in the doc store and run the transformations.
    DocStoreStrategy["UPSERTS"] = "upserts";
    // Only handle duplicates. Checks if the hash of a document is already in the doc store. Only then it will add the document to the doc store and run the transformations
    DocStoreStrategy["DUPLICATES_ONLY"] = "duplicates_only";
    // Use upserts and delete to handle duplicates. Like the upsert strategy but it will also delete non-existing documents from the doc store
    DocStoreStrategy["UPSERTS_AND_DELETE"] = "upserts_and_delete";
    DocStoreStrategy["NONE"] = "none";
    return DocStoreStrategy;
}({});
class NoOpStrategy extends RollbackableTransformComponent {
    constructor(){
        super(async (nodes)=>nodes);
    }
}
export function createDocStoreStrategy(docStoreStrategy, docStore, vectorStores = []) {
    if (docStoreStrategy === "none") {
        return new NoOpStrategy();
    }
    if (!docStore) {
        throw new Error("docStore is required to create a doc store strategy.");
    }
    if (vectorStores.length > 0) {
        if (docStoreStrategy === "upserts") {
            return new UpsertsStrategy(docStore, vectorStores);
        } else if (docStoreStrategy === "upserts_and_delete") {
            return new UpsertsAndDeleteStrategy(docStore, vectorStores);
        } else if (docStoreStrategy === "duplicates_only") {
            return new DuplicatesStrategy(docStore);
        } else {
            throw new Error(`Invalid docstore strategy: ${docStoreStrategy}`);
        }
    } else {
        if (docStoreStrategy === "upserts") {
            console.warn("Docstore strategy set to upserts, but no vector store. Switching to duplicates_only strategy.");
        } else if (docStoreStrategy === "upserts_and_delete") {
            console.warn("Docstore strategy set to upserts and delete, but no vector store. Switching to duplicates_only strategy.");
        }
        return new DuplicatesStrategy(docStore);
    }
}
