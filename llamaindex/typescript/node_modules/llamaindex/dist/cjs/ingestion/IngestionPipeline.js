"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    IngestionPipeline: function() {
        return IngestionPipeline;
    },
    addNodesToVectorStores: function() {
        return addNodesToVectorStores;
    },
    runTransformations: function() {
        return runTransformations;
    }
});
const _schema = require("@llamaindex/core/schema");
const _IngestionCache = require("./IngestionCache.js");
const _index = require("./strategies/index.js");
async function runTransformations(nodesToRun, transformations, // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            const hash = (0, _IngestionCache.getTransformationHash)(nodes, transform);
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
class IngestionPipeline {
    transformations = [];
    documents;
    reader;
    vectorStore;
    vectorStores;
    docStore;
    docStoreStrategy = _index.DocStoreStrategy.UPSERTS;
    cache;
    disableCache = false;
    _docStoreStrategy;
    constructor(init){
        Object.assign(this, init);
        if (!this.docStore) {
            this.docStoreStrategy = _index.DocStoreStrategy.NONE;
        }
        this.vectorStores = this.vectorStores ?? (this.vectorStore ? {
            [_schema.ModalityType.TEXT]: this.vectorStore
        } : undefined);
        this._docStoreStrategy = (0, _index.createDocStoreStrategy)(this.docStoreStrategy, this.docStore, this.vectorStores ? Object.values(this.vectorStores) : undefined);
        if (!this.disableCache) {
            this.cache = new _IngestionCache.IngestionCache();
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
async function addNodesToVectorStores(nodes, vectorStores, nodesAdded) {
    const nodeMap = (0, _schema.splitNodesByType)(nodes);
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
