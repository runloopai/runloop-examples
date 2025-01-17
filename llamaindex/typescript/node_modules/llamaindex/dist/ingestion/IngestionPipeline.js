import { ModalityType, splitNodesByType } from "@llamaindex/core/schema";
import { IngestionCache, getTransformationHash } from "./IngestionCache.js";
import { DocStoreStrategy, createDocStoreStrategy } from "./strategies/index.js";
export async function runTransformations(nodesToRun, transformations, // eslint-disable-next-line @typescript-eslint/no-explicit-any
transformOptions = {}, { inPlace = true, cache, docStoreStrategy } = {}) {
    let nodes = nodesToRun;
    if (!inPlace) {
        nodes = [
            ...nodesToRun
        ];
    }
    if (docStoreStrategy) {
        nodes = await docStoreStrategy(nodes);
    }
    for (const transform of transformations){
        if (cache) {
            const hash = getTransformationHash(nodes, transform);
            const cachedNodes = await cache.get(hash);
            if (cachedNodes) {
                nodes = cachedNodes;
            } else {
                nodes = await transform(nodes, transformOptions);
                await cache.put(hash, nodes);
            }
        } else {
            nodes = await transform(nodes, transformOptions);
        }
    }
    return nodes;
}
export class IngestionPipeline {
    transformations = [];
    documents;
    reader;
    vectorStore;
    vectorStores;
    docStore;
    docStoreStrategy = DocStoreStrategy.UPSERTS;
    cache;
    disableCache = false;
    _docStoreStrategy;
    constructor(init){
        Object.assign(this, init);
        if (!this.docStore) {
            this.docStoreStrategy = DocStoreStrategy.NONE;
        }
        this.vectorStores = this.vectorStores ?? (this.vectorStore ? {
            [ModalityType.TEXT]: this.vectorStore
        } : undefined);
        this._docStoreStrategy = createDocStoreStrategy(this.docStoreStrategy, this.docStore, this.vectorStores ? Object.values(this.vectorStores) : undefined);
        if (!this.disableCache) {
            this.cache = new IngestionCache();
        }
    }
    async prepareInput(documents, nodes) {
        const inputNodes = [];
        if (documents) {
            inputNodes.push(documents);
        }
        if (nodes) {
            inputNodes.push(nodes);
        }
        if (this.documents) {
            inputNodes.push(this.documents);
        }
        if (this.reader) {
            // fixme: empty parameter might cause error
            inputNodes.push(await this.reader.loadData());
        }
        return inputNodes.flat();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async run(args = {}, transformOptions) {
        args.cache = args.cache ?? this.cache;
        args.docStoreStrategy = args.docStoreStrategy ?? this._docStoreStrategy;
        const inputNodes = await this.prepareInput(args.documents, args.nodes);
        const nodes = await runTransformations(inputNodes, this.transformations, transformOptions, args);
        if (this.vectorStores) {
            const nodesToAdd = nodes.filter((node)=>node.embedding);
            await addNodesToVectorStores(nodesToAdd, this.vectorStores);
        }
        return nodes;
    }
}
export async function addNodesToVectorStores(nodes, vectorStores, nodesAdded) {
    const nodeMap = splitNodesByType(nodes);
    for(const type in nodeMap){
        const nodes = nodeMap[type];
        if (nodes) {
            const vectorStore = vectorStores[type];
            if (!vectorStore) {
                throw new Error(`Cannot insert nodes of type ${type} without assigned vector store`);
            }
            const newIds = await vectorStore.add(nodes);
            if (nodesAdded) {
                await nodesAdded(newIds, nodes, vectorStore);
            }
        }
    }
}
