"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "KVIndexStore", {
    enumerable: true,
    get: function() {
        return KVIndexStore;
    }
});
const _datastructs = require("@llamaindex/core/data-structs");
const _global = require("@llamaindex/core/global");
const _indexstore = require("@llamaindex/core/storage/index-store");
const _lodash = /*#__PURE__*/ _interop_require_default(require("lodash"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class KVIndexStore extends _indexstore.BaseIndexStore {
    _kvStore;
    _collection;
    constructor(kvStore, namespace = _global.DEFAULT_NAMESPACE){
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
        if (_lodash.default.isNil(structId)) {
            const structs = await this.getIndexStructs();
            if (structs.length !== 1) {
                throw new Error("More than one index struct found");
            }
            return structs[0];
        } else {
            const json = await this._kvStore.get(structId, this._collection);
            if (_lodash.default.isNil(json)) {
                return;
            }
            return (0, _datastructs.jsonToIndexStruct)(json);
        }
    }
    async getIndexStructs() {
        const jsons = await this._kvStore.getAll(this._collection);
        return _lodash.default.values(jsons).map((json)=>(0, _datastructs.jsonToIndexStruct)(json));
    }
}
