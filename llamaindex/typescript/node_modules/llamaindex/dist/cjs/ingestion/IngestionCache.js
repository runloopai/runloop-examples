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
    IngestionCache: function() {
        return IngestionCache;
    },
    getTransformationHash: function() {
        return getTransformationHash;
    }
});
const _schema = require("@llamaindex/core/schema");
const _docstore = require("@llamaindex/core/storage/doc-store");
const _kvstore = require("@llamaindex/core/storage/kv-store");
const _env = require("@llamaindex/env");
const transformToJSON = (obj)=>{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seen = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const replacer = (key, value)=>{
        if (value != null && typeof value == "object") {
            if (seen.indexOf(value) >= 0) {
                return;
            }
            seen.push(value);
        }
        return value;
    };
    // this is a custom replacer function that will allow us to handle circular references
    const jsonStr = JSON.stringify(obj, replacer);
    return jsonStr;
};
function getTransformationHash(nodes, transform) {
    const nodesStr = nodes.map((node)=>node.getContent(_schema.MetadataMode.ALL)).join("");
    const transformString = transformToJSON(transform);
    const hash = (0, _env.createSHA256)();
    hash.update(nodesStr + transformString + transform.id);
    return hash.digest();
}
class IngestionCache {
    collection = "llama_cache";
    cache;
    nodesKey = "nodes";
    constructor(collection){
        if (collection) {
            this.collection = collection;
        }
        this.cache = new _kvstore.SimpleKVStore();
    }
    async put(hash, nodes) {
        const val = {
            [this.nodesKey]: nodes.map((node)=>(0, _docstore.docToJson)(node, _docstore.jsonSerializer))
        };
        await this.cache.put(hash, val, this.collection);
    }
    async get(hash) {
        const json = await this.cache.get(hash, this.collection);
        if (!json || !json[this.nodesKey] || !Array.isArray(json[this.nodesKey])) {
            return undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return json[this.nodesKey].map((doc)=>(0, _docstore.jsonToDoc)(doc, _docstore.jsonSerializer));
    }
}
