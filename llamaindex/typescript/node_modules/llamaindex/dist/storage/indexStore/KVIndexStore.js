import { jsonToIndexStruct } from "@llamaindex/core/data-structs";
import { DEFAULT_NAMESPACE } from "@llamaindex/core/global";
import { BaseIndexStore } from "@llamaindex/core/storage/index-store";
import _ from "lodash";
export class KVIndexStore extends BaseIndexStore {
    _kvStore;
    _collection;
    constructor(kvStore, namespace = DEFAULT_NAMESPACE){
        super();
        this._kvStore = kvStore;
        this._collection = `${namespace}/data`;
    }
    async addIndexStruct(indexStruct) {
        const key = indexStruct.indexId;
        const data = indexStruct.toJson();
        await this._kvStore.put(key, data, this._collection);
    }
    async deleteIndexStruct(key) {
        await this._kvStore.delete(key, this._collection);
    }
    async getIndexStruct(structId) {
        if (_.isNil(structId)) {
            const structs = await this.getIndexStructs();
            if (structs.length !== 1) {
                throw new Error("More than one index struct found");
            }
            return structs[0];
        } else {
            const json = await this._kvStore.get(structId, this._collection);
            if (_.isNil(json)) {
                return;
            }
            return jsonToIndexStruct(json);
        }
    }
    async getIndexStructs() {
        const jsons = await this._kvStore.getAll(this._collection);
        return _.values(jsons).map((json)=>jsonToIndexStruct(json));
    }
}
