import { UUID } from '../../global/dist/index.js';
import { BaseNode } from '../../schema/dist/index.js';

declare const IndexStructType: {
    readonly NODE: "node";
    readonly TREE: "tree";
    readonly LIST: "list";
    readonly KEYWORD_TABLE: "keyword_table";
    readonly DICT: "dict";
    readonly SIMPLE_DICT: "simple_dict";
    readonly WEAVIATE: "weaviate";
    readonly PINECONE: "pinecone";
    readonly QDRANT: "qdrant";
    readonly LANCEDB: "lancedb";
    readonly MILVUS: "milvus";
    readonly CHROMA: "chroma";
    readonly MYSCALE: "myscale";
    readonly CLICKHOUSE: "clickhouse";
    readonly VECTOR_STORE: "vector_store";
    readonly OPENSEARCH: "opensearch";
    readonly DASHVECTOR: "dashvector";
    readonly CHATGPT_RETRIEVAL_PLUGIN: "chatgpt_retrieval_plugin";
    readonly DEEPLAKE: "deeplake";
    readonly EPSILLA: "epsilla";
    readonly MULTIMODAL_VECTOR_STORE: "multimodal";
    readonly SQL: "sql";
    readonly KG: "kg";
    readonly SIMPLE_KG: "simple_kg";
    readonly SIMPLE_LPG: "simple_lpg";
    readonly NEBULAGRAPH: "nebulagraph";
    readonly FALKORDB: "falkordb";
    readonly EMPTY: "empty";
    readonly COMPOSITE: "composite";
    readonly PANDAS: "pandas";
    readonly DOCUMENT_SUMMARY: "document_summary";
    readonly VECTARA: "vectara";
    readonly ZILLIZ_CLOUD_PIPELINE: "zilliz_cloud_pipeline";
    readonly POSTGRESML: "postgresml";
};
type IndexStructType = (typeof IndexStructType)[keyof typeof IndexStructType];

declare abstract class IndexStruct {
    indexId: string;
    summary: string | undefined;
    constructor(indexId?: UUID, summary?: string | undefined);
    toJson(): Record<string, unknown>;
    getSummary(): string;
}
declare class KeywordTable extends IndexStruct {
    table: Map<string, Set<string>>;
    type: IndexStructType;
    addNode(keywords: string[], nodeId: string): void;
    deleteNode(keywords: string[], nodeId: string): void;
    toJson(): Record<string, unknown>;
}
declare class IndexDict extends IndexStruct {
    nodesDict: Record<string, BaseNode>;
    type: IndexStructType;
    addNode(node: BaseNode, textId?: string): void;
    toJson(): Record<string, unknown>;
    delete(nodeId: string): void;
}
declare class IndexList extends IndexStruct {
    nodes: string[];
    type: IndexStructType;
    addNode(node: BaseNode): void;
    toJson(): Record<string, unknown>;
}

declare function jsonToIndexStruct(json: any): IndexStruct;

export { IndexDict, IndexList, IndexStruct, IndexStructType, KeywordTable, jsonToIndexStruct };
