import { RollbackableTransformComponent } from "./rollback.js";
/**
 * Handle doc store duplicates by checking all hashes.
 */ export class DuplicatesStrategy extends RollbackableTransformComponent {
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
