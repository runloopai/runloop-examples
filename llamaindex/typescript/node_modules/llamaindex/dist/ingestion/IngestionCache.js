import { MetadataMode } from "@llamaindex/core/schema";
import { docToJson, jsonSerializer, jsonToDoc } from "@llamaindex/core/storage/doc-store";
import { SimpleKVStore } from "@llamaindex/core/storage/kv-store";
import { createSHA256 } from "@llamaindex/env";
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
export function getTransformationHash(nodes, transform) {
    const nodesStr = nodes.map((node)=>node.getContent(MetadataMode.ALL)).join("");
    const transformString = transformToJSON(transform);
    const hash = createSHA256();
    hash.update(nodesStr + transformString + transform.id);
    return hash.digest();
}
export class IngestionCache {
    collection = "llama_cache";
    cache;
    nodesKey = "nodes";
    constructor(collection){
        if (collection) {
            this.collection = collection;
        }
        this.cache = new SimpleKVStore();
    }
    async put(hash, nodes) {
        const val = {
            [this.nodesKey]: nodes.map((node)=>docToJson(node, jsonSerializer))
        };
        await this.cache.put(hash, val, this.collection);
    }
    async get(hash) {
        const json = await this.cache.get(hash, this.collection);
        if (!json || !json[this.nodesKey] || !Array.isArray(json[this.nodesKey])) {
            return undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return json[this.nodesKey].map((doc)=>jsonToDoc(doc, jsonSerializer));
    }
}
