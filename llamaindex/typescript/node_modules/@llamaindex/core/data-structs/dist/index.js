import { randomUUID } from '@llamaindex/env';
import { jsonToNode } from '../../schema/dist/index.js';

const IndexStructType = {
    NODE: "node",
    TREE: "tree",
    LIST: "list",
    KEYWORD_TABLE: "keyword_table",
    DICT: "dict",
    SIMPLE_DICT: "simple_dict",
    WEAVIATE: "weaviate",
    PINECONE: "pinecone",
    QDRANT: "qdrant",
    LANCEDB: "lancedb",
    MILVUS: "milvus",
    CHROMA: "chroma",
    MYSCALE: "myscale",
    CLICKHOUSE: "clickhouse",
    VECTOR_STORE: "vector_store",
    OPENSEARCH: "opensearch",
    DASHVECTOR: "dashvector",
    CHATGPT_RETRIEVAL_PLUGIN: "chatgpt_retrieval_plugin",
    DEEPLAKE: "deeplake",
    EPSILLA: "epsilla",
    MULTIMODAL_VECTOR_STORE: "multimodal",
    SQL: "sql",
    KG: "kg",
    SIMPLE_KG: "simple_kg",
    SIMPLE_LPG: "simple_lpg",
    NEBULAGRAPH: "nebulagraph",
    FALKORDB: "falkordb",
    EMPTY: "empty",
    COMPOSITE: "composite",
    PANDAS: "pandas",
    DOCUMENT_SUMMARY: "document_summary",
    VECTARA: "vectara",
    ZILLIZ_CLOUD_PIPELINE: "zilliz_cloud_pipeline",
    POSTGRESML: "postgresml"
};

class IndexStruct {
    constructor(indexId = randomUUID(), summary = undefined){
        this.indexId = indexId;
        this.summary = summary;
    }
    toJson() {
        return {
            indexId: this.indexId,
            summary: this.summary
        };
    }
    getSummary() {
        if (this.summary === undefined) {
            throw new Error("summary field of the index struct is not set");
        }
        return this.summary;
    }
}
// A table of keywords mapping keywords to text chunks.
class KeywordTable extends IndexStruct {
    addNode(keywords, nodeId) {
        keywords.forEach((keyword)=>{
            if (!this.table.has(keyword)) {
                this.table.set(keyword, new Set());
            }
            this.table.get(keyword).add(nodeId);
        });
    }
    deleteNode(keywords, nodeId) {
        keywords.forEach((keyword)=>{
            if (this.table.has(keyword)) {
                this.table.get(keyword).delete(nodeId);
            }
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            table: Array.from(this.table.entries()).reduce((acc, [keyword, nodeIds])=>{
                acc[keyword] = Array.from(nodeIds);
                return acc;
            }, {}),
            type: this.type
        };
    }
    constructor(...args){
        super(...args), this.table = new Map(), this.type = IndexStructType.KEYWORD_TABLE;
    }
}
class IndexDict extends IndexStruct {
    addNode(node, textId) {
        const vectorId = textId ?? node.id_;
        this.nodesDict[vectorId] = node;
    }
    toJson() {
        const nodesDict = {};
        for (const [key, node] of Object.entries(this.nodesDict)){
            nodesDict[key] = node.toJSON();
        }
        return {
            ...super.toJson(),
            nodesDict,
            type: this.type
        };
    }
    delete(nodeId) {
        delete this.nodesDict[nodeId];
    }
    constructor(...args){
        super(...args), this.nodesDict = {}, this.type = IndexStructType.SIMPLE_DICT;
    }
}
class IndexList extends IndexStruct {
    addNode(node) {
        this.nodes.push(node.id_);
    }
    toJson() {
        return {
            ...super.toJson(),
            nodes: this.nodes,
            type: this.type
        };
    }
    constructor(...args){
        super(...args), this.nodes = [], this.type = IndexStructType.LIST;
    }
}

function jsonToIndexStruct(// eslint-disable-next-line @typescript-eslint/no-explicit-any
json) {
    if (json.type === IndexStructType.LIST) {
        const indexList = new IndexList(json.indexId, json.summary);
        indexList.nodes = json.nodes;
        return indexList;
    } else if (json.type === IndexStructType.SIMPLE_DICT) {
        const indexDict = new IndexDict(json.indexId, json.summary);
        indexDict.nodesDict = Object.entries(json.nodesDict).reduce((acc, [key, value])=>{
            acc[key] = jsonToNode(value);
            return acc;
        }, {});
        return indexDict;
    } else {
        throw new Error(`Unknown index struct type: ${json.type}`);
    }
}

export { IndexDict, IndexList, IndexStruct, IndexStructType, KeywordTable, jsonToIndexStruct };
