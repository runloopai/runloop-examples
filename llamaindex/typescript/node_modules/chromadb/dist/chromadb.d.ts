import * as openai from 'openai';
import * as _xenova_transformers from '@xenova/transformers';
import * as chromadb_default_embed from 'chromadb-default-embed';
import * as _google_generative_ai from '@google/generative-ai';

interface IEmbeddingFunction {
    generate(texts: string[]): Promise<number[][]>;
}

type AuthHeaders = {
    [header: string]: string;
};
type TokenHeaderType = "AUTHORIZATION" | "X_CHROMA_TOKEN";
type AuthOptions = {
    provider: ClientAuthProvider | string | undefined;
    credentials?: any | undefined;
    tokenHeaderType?: TokenHeaderType | undefined;
};
interface ClientAuthProvider {
    /**
     * Abstract method for authenticating a client.
     */
    authenticate(): AuthHeaders;
}

declare enum IncludeEnum {
    Documents = "documents",
    Embeddings = "embeddings",
    Metadatas = "metadatas",
    Distances = "distances"
}
type Embedding = number[];
type Embeddings = Embedding[];
type Metadata = Record<string, string | number | boolean>;
type Metadatas = Metadata[];
type Document = string;
type Documents = Document[];
type ID = string;
type IDs = ID[];
type PositiveInteger = number;
type LiteralValue = string | number | boolean;
type ListLiteralValue = LiteralValue[];
type LiteralNumber = number;
type LogicalOperator = "$and" | "$or";
type InclusionOperator = "$in" | "$nin";
type WhereOperator = "$gt" | "$gte" | "$lt" | "$lte" | "$ne" | "$eq";
type OperatorExpression = {
    [key in WhereOperator | InclusionOperator | LogicalOperator]?: LiteralValue | ListLiteralValue;
};
type BaseWhere = {
    [key: string]: LiteralValue | OperatorExpression;
};
type LogicalWhere = {
    [key in LogicalOperator]?: Where[];
};
type Where = BaseWhere | LogicalWhere;
type WhereDocumentOperator = "$contains" | "$not_contains" | LogicalOperator;
type WhereDocument = {
    [key in WhereDocumentOperator]?: LiteralValue | LiteralNumber | WhereDocument[];
};
type CollectionType = {
    name: string;
    id: string;
    metadata: Metadata | null;
    configuration_json: any;
};
type MultiGetResponse = {
    ids: IDs;
    embeddings: Embeddings | null;
    documents: (Document | null)[];
    metadatas: (Metadata | null)[];
    included: IncludeEnum[];
};
type GetResponse = MultiGetResponse;
type SingleQueryResponse = {
    ids: IDs;
    embeddings: Embeddings | null;
    documents: (Document | null)[];
    metadatas: (Metadata | null)[];
    distances: number[] | null;
    included: IncludeEnum[];
};
type MultiQueryResponse = {
    ids: IDs[];
    embeddings: Embeddings[] | null;
    documents: (Document | null)[][];
    metadatas: (Metadata | null)[][];
    distances: number[][] | null;
    included: IncludeEnum[];
};
type QueryResponse = SingleQueryResponse | MultiQueryResponse;
interface CollectionParams {
    name: string;
    id: string;
    metadata: CollectionMetadata | undefined;
    embeddingFunction: IEmbeddingFunction;
}
type CollectionMetadata = Record<string, unknown>;
type ConfigOptions = {
    options?: RequestInit;
};
type BaseGetParams = {
    ids?: ID | IDs;
    where?: Where;
    limit?: PositiveInteger;
    offset?: PositiveInteger;
    include?: IncludeEnum[];
    whereDocument?: WhereDocument;
};
type SingleGetParams = BaseGetParams & {
    ids: ID;
};
type MultiGetParams = BaseGetParams & {
    ids?: IDs;
};
type GetParams = SingleGetParams | MultiGetParams;
type ListCollectionsParams = {
    limit?: PositiveInteger;
    offset?: PositiveInteger;
};
type ChromaClientParams = {
    path?: string;
    fetchOptions?: RequestInit;
    auth?: AuthOptions;
    tenant?: string;
    database?: string;
};
type CreateCollectionParams = {
    name: string;
    metadata?: CollectionMetadata;
    embeddingFunction?: IEmbeddingFunction;
};
type GetOrCreateCollectionParams = CreateCollectionParams;
type GetCollectionParams = {
    name: string;
    embeddingFunction: IEmbeddingFunction;
};
type DeleteCollectionParams = {
    name: string;
};
type BaseRecordOperationParams = {
    ids: ID | IDs;
    embeddings?: Embedding | Embeddings;
    metadatas?: Metadata | Metadatas;
    documents?: Document | Documents;
};
type SingleRecordOperationParams = BaseRecordOperationParams & {
    ids: ID;
    embeddings?: Embedding;
    metadatas?: Metadata;
    documents?: Document;
};
type SingleEmbeddingRecordOperationParams = SingleRecordOperationParams & {
    embeddings: Embedding;
};
type SingleContentRecordOperationParams = SingleRecordOperationParams & {
    documents: Document;
};
type SingleAddRecordOperationParams = SingleEmbeddingRecordOperationParams | SingleContentRecordOperationParams;
type MultiRecordOperationParams = BaseRecordOperationParams & {
    ids: IDs;
    embeddings?: Embeddings;
    metadatas?: Metadatas;
    documents?: Documents;
};
type MultiEmbeddingRecordOperationParams = MultiRecordOperationParams & {
    embeddings: Embeddings;
};
type MultiContentRecordOperationParams = MultiRecordOperationParams & {
    documents: Documents;
};
type MultiAddRecordsOperationParams = MultiEmbeddingRecordOperationParams | MultiContentRecordOperationParams;
type AddRecordsParams = SingleAddRecordOperationParams | MultiAddRecordsOperationParams;
type UpsertRecordsParams = AddRecordsParams;
type UpdateRecordsParams = MultiRecordOperationParams | SingleRecordOperationParams;
type ModifyCollectionParams = {
    name?: string;
    metadata?: CollectionMetadata;
};
type BaseQueryParams = {
    nResults?: PositiveInteger;
    where?: Where;
    queryTexts?: string | string[];
    queryEmbeddings?: Embedding | Embeddings;
    whereDocument?: WhereDocument;
    include?: IncludeEnum[];
};
type SingleTextQueryParams = BaseQueryParams & {
    queryTexts: string;
    queryEmbeddings?: never;
};
type SingleEmbeddingQueryParams = BaseQueryParams & {
    queryTexts?: never;
    queryEmbeddings: Embedding;
};
type MultiTextQueryParams = BaseQueryParams & {
    queryTexts: string[];
    queryEmbeddings?: never;
};
type MultiEmbeddingQueryParams = BaseQueryParams & {
    queryTexts?: never;
    queryEmbeddings: Embeddings;
};
type QueryRecordsParams = SingleTextQueryParams | SingleEmbeddingQueryParams | MultiTextQueryParams | MultiEmbeddingQueryParams;
type PeekParams = {
    limit?: PositiveInteger;
};
type DeleteParams = {
    ids?: ID | IDs;
    where?: Where;
    whereDocument?: WhereDocument;
};

declare class Collection {
    name: string;
    id: string;
    metadata: CollectionMetadata | undefined;
    /**
     * @ignore
     */
    private client;
    /**
     * @ignore
     */
    embeddingFunction: IEmbeddingFunction;
    /**
     * @ignore
     */
    constructor(name: string, id: string, client: ChromaClient, embeddingFunction: IEmbeddingFunction, metadata?: CollectionMetadata);
    /**
     * Add items to the collection
     * @param {Object} params - The parameters for the query.
     * @param {ID | IDs} [params.ids] - IDs of the items to add.
     * @param {Embedding | Embeddings} [params.embeddings] - Optional embeddings of the items to add.
     * @param {Metadata | Metadatas} [params.metadatas] - Optional metadata of the items to add.
     * @param {Document | Documents} [params.documents] - Optional documents of the items to add.
     * @returns {Promise<AddResponse>} - The response from the API. True if successful.
     *
     * @example
     * ```typescript
     * const response = await collection.add({
     *   ids: ["id1", "id2"],
     *   embeddings: [[1, 2, 3], [4, 5, 6]],
     *   metadatas: [{ "key": "value" }, { "key": "value" }],
     *   documents: ["document1", "document2"]
     * });
     * ```
     */
    add(params: AddRecordsParams): Promise<void>;
    /**
     * Upsert items to the collection
     * @param {Object} params - The parameters for the query.
     * @param {ID | IDs} [params.ids] - IDs of the items to add.
     * @param {Embedding | Embeddings} [params.embeddings] - Optional embeddings of the items to add.
     * @param {Metadata | Metadatas} [params.metadatas] - Optional metadata of the items to add.
     * @param {Document | Documents} [params.documents] - Optional documents of the items to add.
     * @returns {Promise<void>}
     *
     * @example
     * ```typescript
     * const response = await collection.upsert({
     *   ids: ["id1", "id2"],
     *   embeddings: [[1, 2, 3], [4, 5, 6]],
     *   metadatas: [{ "key": "value" }, { "key": "value" }],
     *   documents: ["document1", "document2"],
     * });
     * ```
     */
    upsert(params: UpsertRecordsParams): Promise<void>;
    /**
     * Count the number of items in the collection
     * @returns {Promise<number>} - The number of items in the collection.
     *
     * @example
     * ```typescript
     * const count = await collection.count();
     * ```
     */
    count(): Promise<number>;
    /**
     * Get items from the collection
     * @param {Object} params - The parameters for the query.
     * @param {ID | IDs} [params.ids] - Optional IDs of the items to get.
     * @param {Where} [params.where] - Optional where clause to filter items by.
     * @param {PositiveInteger} [params.limit] - Optional limit on the number of items to get.
     * @param {PositiveInteger} [params.offset] - Optional offset on the items to get.
     * @param {IncludeEnum[]} [params.include] - Optional list of items to include in the response.
     * @param {WhereDocument} [params.whereDocument] - Optional where clause to filter items by.
     * @returns {Promise<GetResponse>} - The response from the server.
     *
     * @example
     * ```typescript
     * const response = await collection.get({
     *   ids: ["id1", "id2"],
     *   where: { "key": "value" },
     *   limit: 10,
     *   offset: 0,
     *   include: ["embeddings", "metadatas", "documents"],
     *   whereDocument: { $contains: "value" },
     * });
     * ```
     */
    get({ ids, where, limit, offset, include, whereDocument, }?: BaseGetParams): Promise<GetResponse>;
    /**
     * Update items in the collection
     * @param {Object} params - The parameters for the query.
     * @param {ID | IDs} [params.ids] - IDs of the items to add.
     * @param {Embedding | Embeddings} [params.embeddings] - Optional embeddings of the items to add.
     * @param {Metadata | Metadatas} [params.metadatas] - Optional metadata of the items to add.
     * @param {Document | Documents} [params.documents] - Optional documents of the items to add.
     * @returns {Promise<void>}
     *
     * @example
     * ```typescript
     * const response = await collection.update({
     *   ids: ["id1", "id2"],
     *   embeddings: [[1, 2, 3], [4, 5, 6]],
     *   metadatas: [{ "key": "value" }, { "key": "value" }],
     *   documents: ["document1", "document2"],
     * });
     * ```
     */
    update(params: UpdateRecordsParams): Promise<void>;
    /**
     * Performs a query on the collection using the specified parameters.
     *
     * @param {Object} params - The parameters for the query.
     * @param {Embedding | Embeddings} [params.queryEmbeddings] - Optional query embeddings to use for the search.
     * @param {PositiveInteger} [params.nResults] - Optional number of results to return (default is 10).
     * @param {Where} [params.where] - Optional query condition to filter results based on metadata values.
     * @param {string | string[]} [params.queryTexts] - Optional query text(s) to search for in the collection.
     * @param {WhereDocument} [params.whereDocument] - Optional query condition to filter results based on document content.
     * @param {IncludeEnum[]} [params.include] - Optional array of fields to include in the result, such as "metadata" and "document".
     *
     * @returns {Promise<QueryResponse>} A promise that resolves to the query results.
     * @throws {Error} If there is an issue executing the query.
     * @example
     * // Query the collection using embeddings
     * const results = await collection.query({
     *   queryEmbeddings: [[0.1, 0.2, ...], ...],
     *   nResults: 10,
     *   where: {"name": {"$eq": "John Doe"}},
     *   include: ["metadata", "document"]
     * });
     * @example
     * ```js
     * // Query the collection using query text
     * const results = await collection.query({
     *   queryTexts: "some text",
     *   nResults: 10,
     *   where: {"name": {"$eq": "John Doe"}},
     *   include: ["metadata", "document"]
     * });
     * ```
     *
     */
    query({ nResults, where, whereDocument, include, queryTexts, queryEmbeddings, }: QueryRecordsParams): Promise<MultiQueryResponse>;
    /**
     * Modify the collection name or metadata
     * @param {Object} params - The parameters for the query.
     * @param {string} [params.name] - Optional new name for the collection.
     * @param {CollectionMetadata} [params.metadata] - Optional new metadata for the collection.
     * @returns {Promise<void>} - The response from the API.
     *
     * @example
     * ```typescript
     * const response = await client.updateCollection({
     *   name: "new name",
     *   metadata: { "key": "value" },
     * });
     * ```
     */
    modify({ name, metadata, }: {
        name?: string;
        metadata?: CollectionMetadata;
    }): Promise<CollectionParams>;
    /**
     * Peek inside the collection
     * @param {Object} params - The parameters for the query.
     * @param {PositiveInteger} [params.limit] - Optional number of results to return (default is 10).
     * @returns {Promise<GetResponse>} A promise that resolves to the query results.
     * @throws {Error} If there is an issue executing the query.
     *
     * @example
     * ```typescript
     * const results = await collection.peek({
     *   limit: 10
     * });
     * ```
     */
    peek({ limit }?: PeekParams): Promise<MultiGetResponse>;
    /**
     * Deletes items from the collection.
     * @param {Object} params - The parameters for deleting items from the collection.
     * @param {ID | IDs} [params.ids] - Optional ID or array of IDs of items to delete.
     * @param {Where} [params.where] - Optional query condition to filter items to delete based on metadata values.
     * @param {WhereDocument} [params.whereDocument] - Optional query condition to filter items to delete based on document content.
     * @returns {Promise<string[]>} A promise that resolves to the IDs of the deleted items.
     * @throws {Error} If there is an issue deleting items from the collection.
     *
     * @example
     * ```typescript
     * const results = await collection.delete({
     *   ids: "some_id",
     *   where: {"name": {"$eq": "John Doe"}},
     *   whereDocument: {"$contains":"search_string"}
     * });
     * ```
     */
    delete({ ids, where, whereDocument }?: DeleteParams): Promise<string[]>;
}

/**
 * FastAPI
 *
 *
 * OpenAPI spec version: 0.1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator+.
 * https://github.com/karlvr/openapi-generator-plus
 * Do not edit the class manually.
 */
interface ConfigurationParameters {
    apiKey?: string | ((name: string) => string | null);
    username?: string;
    password?: string;
    authorization?: string | ((name: string, scopes?: string[]) => string | null);
    basePath?: string;
}
declare class Configuration {
    /**
     * parameter for apiKey security
     * @param name security name
     * @memberof Configuration
     */
    apiKey?: string | ((name: string) => string | null);
    /**
     * parameter for basic security
     *
     * @type {string}
     * @memberof Configuration
     */
    username?: string;
    /**
     * parameter for basic security
     *
     * @type {string}
     * @memberof Configuration
     */
    password?: string;
    /**
     * parameter for oauth2, openIdConnect or http security
     * @param name security name
     * @param scopes oauth2 scopes
     * @memberof Configuration
     */
    authorization?: string | ((name: string, scopes?: string[]) => string | null);
    /**
     * override base path
     *
     * @type {string}
     * @memberof Configuration
     */
    basePath?: string;
    constructor(param?: ConfigurationParameters);
}

/**
 * FastAPI
 *
 *
 * OpenAPI spec version: 0.1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator+.
 * https://github.com/karlvr/openapi-generator-plus
 * Do not edit the class manually.
 */
declare const defaultFetch: typeof fetch;

/**
 *
 * @export
 * @type FetchAPI
 */
type FetchAPI = typeof defaultFetch;
/**
 *
 * @export
 * @class BaseAPI
 */
declare class BaseAPI {
    protected basePath: string;
    protected fetch: FetchAPI;
    protected configuration?: Configuration;
    constructor(configuration?: Configuration, basePath?: string, fetch?: FetchAPI);
}

/**
 * FastAPI
 *
 *
 * OpenAPI spec version: 0.1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator+.
 * https://github.com/karlvr/openapi-generator-plus
 * Do not edit the class manually.
 */
declare namespace Api {
    interface Add201Response {
    }
    interface AddEmbedding {
        embeddings?: Api.AddEmbedding.Embedding[] | null;
        metadatas?: (Api.AddEmbedding.Metadatum | null)[] | null;
        documents?: (string | null)[] | null;
        uris?: (string | null)[] | null;
        ids: string[];
    }
    /**
     * @export
     * @namespace AddEmbedding
     */
    namespace AddEmbedding {
        interface Embedding {
        }
        interface Metadatum {
        }
    }
    interface ADelete200Response {
    }
    interface AGet200Response {
    }
    interface Count200Response {
    }
    interface CountCollections200Response {
    }
    interface CreateCollection {
        name: string;
        configuration: Api.CreateCollection.Configuration | null;
        metadata?: Api.CreateCollection.Metadata | null;
        get_or_create?: boolean;
    }
    /**
     * @export
     * @namespace CreateCollection
     */
    namespace CreateCollection {
        interface Configuration {
        }
        interface Metadata {
        }
    }
    interface CreateCollection200Response {
    }
    interface CreateDatabase {
        name: string;
    }
    interface CreateDatabase200Response {
    }
    interface CreateTenant {
        name: string;
    }
    interface CreateTenant200Response {
    }
    interface DeleteCollection200Response {
    }
    interface DeleteEmbedding {
        ids?: string[] | null;
        where?: Api.DeleteEmbedding.Where | null;
        where_document?: Api.DeleteEmbedding.WhereDocument | null;
    }
    /**
     * @export
     * @namespace DeleteEmbedding
     */
    namespace DeleteEmbedding {
        interface Where {
        }
        interface WhereDocument {
        }
    }
    interface GetCollection200Response {
    }
    interface GetDatabase200Response {
    }
    interface GetEmbedding {
        ids?: string[] | null;
        where?: Api.GetEmbedding.Where | null;
        where_document?: Api.GetEmbedding.WhereDocument | null;
        sort?: string | null;
        /**
         * @type {number | null}
         * @memberof GetEmbedding
         */
        limit?: number | null;
        /**
         * @type {number | null}
         * @memberof GetEmbedding
         */
        offset?: number | null;
        include?: Api.IncludeEnum[];
    }
    /**
     * @export
     * @namespace GetEmbedding
     */
    namespace GetEmbedding {
        interface Where {
        }
        interface WhereDocument {
        }
    }
    interface GetNearestNeighbors200Response {
    }
    interface GetTenant200Response {
    }
    interface HTTPValidationError {
        detail?: Api.ValidationError[];
    }
    enum IncludeEnum {
        Documents = "documents",
        Embeddings = "embeddings",
        Metadatas = "metadatas",
        Distances = "distances",
        Uris = "uris",
        Data = "data"
    }
    interface ListCollections200Response {
    }
    interface PreFlightChecks200Response {
    }
    interface QueryEmbedding {
        where?: Api.QueryEmbedding.Where | null;
        where_document?: Api.QueryEmbedding.WhereDocument | null;
        query_embeddings: Api.QueryEmbedding.QueryEmbedding2[];
        /**
         * @type {number}
         * @memberof QueryEmbedding
         */
        n_results?: number;
        include?: Api.IncludeEnum[];
    }
    /**
     * @export
     * @namespace QueryEmbedding
     */
    namespace QueryEmbedding {
        interface Where {
        }
        interface WhereDocument {
        }
        interface QueryEmbedding2 {
        }
    }
    interface Update200Response {
    }
    interface UpdateCollection {
        new_name?: string | null;
        new_metadata?: Api.UpdateCollection.NewMetadata | null;
    }
    /**
     * @export
     * @namespace UpdateCollection
     */
    namespace UpdateCollection {
        interface NewMetadata {
        }
    }
    interface UpdateCollection200Response {
    }
    interface UpdateEmbedding {
        embeddings?: Api.UpdateEmbedding.Embedding[] | null;
        metadatas?: (Api.UpdateEmbedding.Metadatum | null)[] | null;
        documents?: (string | null)[] | null;
        uris?: (string | null)[] | null;
        ids: string[];
    }
    /**
     * @export
     * @namespace UpdateEmbedding
     */
    namespace UpdateEmbedding {
        interface Embedding {
        }
        interface Metadatum {
        }
    }
    interface Upsert200Response {
    }
    interface ValidationError {
        loc: (string | number)[];
        msg: string;
        type: string;
    }
}

/**
 * FastAPI
 *
 *
 * OpenAPI spec version: 0.1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator+.
 * https://github.com/karlvr/openapi-generator-plus
 * Do not edit the class manually.
 */

/**
 * ApiApi - object-oriented interface
 * @export
 * @class ApiApi
 * @extends {BaseAPI}
 */
declare class ApiApi extends BaseAPI {
    /**
     * @summary Add
     * @param {string} collectionId
     * @param {Api.AddEmbedding} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    add(collectionId: string, request: Api.AddEmbedding, options?: RequestInit): Promise<Api.Add201Response>;
    /**
     * @summary Delete
     * @param {string} collectionId
     * @param {Api.DeleteEmbedding} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    aDelete(collectionId: string, request: Api.DeleteEmbedding, options?: RequestInit): Promise<Api.ADelete200Response>;
    /**
     * @summary Get
     * @param {string} collectionId
     * @param {Api.GetEmbedding} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    aGet(collectionId: string, request: Api.GetEmbedding, options?: RequestInit): Promise<Api.AGet200Response>;
    /**
     * @summary Count
     * @param {string} collectionId
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    count(collectionId: string, options?: RequestInit): Promise<Api.Count200Response>;
    /**
     * @summary Count Collections
     * @param {string} [tenant]
     * @param {string} [database]
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    countCollections(tenant: string | undefined, database: string | undefined, options?: RequestInit): Promise<Api.CountCollections200Response>;
    /**
     * @summary Create Collection
     * @param {string} [tenant]
     * @param {string} [database]
     * @param {Api.CreateCollection} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    createCollection(tenant: string | undefined, database: string | undefined, request: Api.CreateCollection, options?: RequestInit): Promise<Api.CreateCollection200Response>;
    /**
     * @summary Create Database
     * @param {string} [tenant]
     * @param {Api.CreateDatabase} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    createDatabase(tenant: string | undefined, request: Api.CreateDatabase, options?: RequestInit): Promise<Api.CreateDatabase200Response>;
    /**
     * @summary Create Tenant
     * @param {Api.CreateTenant} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    createTenant(request: Api.CreateTenant, options?: RequestInit): Promise<Api.CreateTenant200Response>;
    /**
     * @summary Delete Collection
     * @param {string} collectionName
     * @param {string} [tenant]
     * @param {string} [database]
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    deleteCollection(collectionName: string, tenant: string | undefined, database: string | undefined, options?: RequestInit): Promise<Api.DeleteCollection200Response>;
    /**
     * @summary Get Collection
     * @param {string} collectionName
     * @param {string} [tenant]
     * @param {string} [database]
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    getCollection(collectionName: string, tenant: string | undefined, database: string | undefined, options?: RequestInit): Promise<Api.GetCollection200Response>;
    /**
     * @summary Get Database
     * @param {string} database
     * @param {string} [tenant]
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDatabase(database: string, tenant: string | undefined, options?: RequestInit): Promise<Api.GetDatabase200Response>;
    /**
     * @summary Get Nearest Neighbors
     * @param {string} collectionId
     * @param {Api.QueryEmbedding} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    getNearestNeighbors(collectionId: string, request: Api.QueryEmbedding, options?: RequestInit): Promise<Api.GetNearestNeighbors200Response>;
    /**
     * @summary Get Tenant
     * @param {string} tenant
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    getTenant(tenant: string, options?: RequestInit): Promise<Api.GetTenant200Response>;
    /**
     * @summary Heartbeat
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    heartbeat(options?: RequestInit): Promise<{
        [name: string]: number;
    }>;
    /**
     * @summary List Collections
     * @param {number | null} [limit]
     * @param {number | null} [offset]
     * @param {string} [tenant]
     * @param {string} [database]
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    listCollections(limit: number | null | undefined, offset: number | null | undefined, tenant: string | undefined, database: string | undefined, options?: RequestInit): Promise<Api.ListCollections200Response>;
    /**
     * @summary Pre Flight Checks
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    preFlightChecks(options?: RequestInit): Promise<Api.PreFlightChecks200Response>;
    /**
     * @summary Reset
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    reset(options?: RequestInit): Promise<boolean>;
    /**
     * @summary Root
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    root(options?: RequestInit): Promise<{
        [name: string]: number;
    }>;
    /**
     * @summary Update
     * @param {string} collectionId
     * @param {Api.UpdateEmbedding} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    update(collectionId: string, request: Api.UpdateEmbedding, options?: RequestInit): Promise<Api.Update200Response>;
    /**
     * @summary Update Collection
     * @param {string} collectionId
     * @param {Api.UpdateCollection} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    updateCollection(collectionId: string, request: Api.UpdateCollection, options?: RequestInit): Promise<Api.UpdateCollection200Response>;
    /**
     * @summary Upsert
     * @param {string} collectionId
     * @param {Api.AddEmbedding} request
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    upsert(collectionId: string, request: Api.AddEmbedding, options?: RequestInit): Promise<Api.Upsert200Response>;
    /**
     * @summary Version
     * @param {RequestInit} [options] Override http request option.
     * @throws {RequiredError}
     */
    version(options?: RequestInit): Promise<string>;
}

declare class ChromaClient {
    /**
     * @ignore
     */
    api: ApiApi & ConfigOptions;
    /**
     * @ignore
     */
    private tenant;
    /**
     * @ignore
     */
    private database;
    /**
     * @ignore
     */
    private _adminClient;
    /**
     * @ignore
     */
    private authProvider;
    /**
     * @ignore
     */
    private _initPromise;
    /**
     * Creates a new ChromaClient instance.
     * @param {Object} params - The parameters for creating a new client
     * @param {string} [params.path] - The base path for the Chroma API.
     * @returns {ChromaClient} A new ChromaClient instance.
     *
     * @example
     * ```typescript
     * const client = new ChromaClient({
     *   path: "http://localhost:8000"
     * });
     * ```
     */
    constructor({ path, fetchOptions, auth, tenant, database, }?: ChromaClientParams);
    /** @ignore */
    init(): Promise<void>;
    /**
     * Resets the state of the object by making an API call to the reset endpoint.
     *
     * @returns {Promise<boolean>} A promise that resolves when the reset operation is complete.
     * @throws {ChromaConnectionError} If the client is unable to connect to the server.
     * @throws {ChromaServerError} If the server experienced an error while the state.
     *
     * @example
     * ```typescript
     * await client.reset();
     * ```
     */
    reset(): Promise<boolean>;
    /**
     * Returns the version of the Chroma API.
     * @returns {Promise<string>} A promise that resolves to the version of the Chroma API.
     * @throws {ChromaConnectionError} If the client is unable to connect to the server.
     *
     * @example
     * ```typescript
     * const version = await client.version();
     * ```
     */
    version(): Promise<string>;
    /**
     * Returns a heartbeat from the Chroma API.
     * @returns {Promise<number>} A promise that resolves to the heartbeat from the Chroma API.
     * @throws {ChromaConnectionError} If the client is unable to connect to the server.
     *
     * @example
     * ```typescript
     * const heartbeat = await client.heartbeat();
     * ```
     */
    heartbeat(): Promise<number>;
    /**
     * Creates a new collection with the specified properties.
     *
     * @param {Object} params - The parameters for creating a new collection.
     * @param {string} params.name - The name of the collection.
     * @param {CollectionMetadata} [params.metadata] - Optional metadata associated with the collection.
     * @param {IEmbeddingFunction} [params.embeddingFunction] - Optional custom embedding function for the collection.
     *
     * @returns {Promise<Collection>} A promise that resolves to the created collection.
     * @throws {ChromaConnectionError} If the client is unable to connect to the server.
     * @throws {ChromaServerError} If there is an issue creating the collection.
     *
     * @example
     * ```typescript
     * const collection = await client.createCollection({
     *   name: "my_collection",
     *   metadata: {
     *     "description": "My first collection"
     *   }
     * });
     * ```
     */
    createCollection({ name, metadata, embeddingFunction, }: CreateCollectionParams): Promise<Collection>;
    /**
     * Gets or creates a collection with the specified properties.
     *
     * @param {Object} params - The parameters for creating a new collection.
     * @param {string} params.name - The name of the collection.
     * @param {CollectionMetadata} [params.metadata] - Optional metadata associated with the collection.
     * @param {IEmbeddingFunction} [params.embeddingFunction] - Optional custom embedding function for the collection.
     *
     * @returns {Promise<Collection>} A promise that resolves to the got or created collection.
     * @throws {Error} If there is an issue getting or creating the collection.
     *
     * @example
     * ```typescript
     * const collection = await client.getOrCreateCollection({
     *   name: "my_collection",
     *   metadata: {
     *     "description": "My first collection"
     *   }
     * });
     * ```
     */
    getOrCreateCollection({ name, metadata, embeddingFunction, }: GetOrCreateCollectionParams): Promise<Collection>;
    /**
     * Lists all collections.
     *
     * @returns {Promise<CollectionType[]>} A promise that resolves to a list of collection names.
     * @param {PositiveInteger} [params.limit] - Optional limit on the number of items to get.
     * @param {PositiveInteger} [params.offset] - Optional offset on the items to get.
     * @throws {Error} If there is an issue listing the collections.
     *
     * @example
     * ```typescript
     * const collections = await client.listCollections({
     *     limit: 10,
     *     offset: 0,
     * });
     * ```
     */
    listCollections({ limit, offset }?: ListCollectionsParams): Promise<CollectionParams[]>;
    /**
     * Counts all collections.
     *
     * @returns {Promise<number>} A promise that resolves to the number of collections.
     * @throws {Error} If there is an issue counting the collections.
     *
     * @example
     * ```typescript
     * const collections = await client.countCollections();
     * ```
     */
    countCollections(): Promise<number>;
    /**
     * Gets a collection with the specified name.
     * @param {Object} params - The parameters for getting a collection.
     * @param {string} params.name - The name of the collection.
     * @param {IEmbeddingFunction} [params.embeddingFunction] - Optional custom embedding function for the collection.
     * @returns {Promise<Collection>} A promise that resolves to the collection.
     * @throws {Error} If there is an issue getting the collection.
     *
     * @example
     * ```typescript
     * const collection = await client.getCollection({
     *   name: "my_collection"
     * });
     * ```
     */
    getCollection({ name, embeddingFunction, }: GetCollectionParams): Promise<Collection>;
    /**
     * Deletes a collection with the specified name.
     * @param {Object} params - The parameters for deleting a collection.
     * @param {string} params.name - The name of the collection.
     * @returns {Promise<void>} A promise that resolves when the collection is deleted.
     * @throws {Error} If there is an issue deleting the collection.
     *
     * @example
     * ```typescript
     * await client.deleteCollection({
     *  name: "my_collection"
     * });
     * ```
     */
    deleteCollection({ name }: DeleteCollectionParams): Promise<void>;
}

interface Tenant {
    name: string;
}
interface Database {
    name: string;
}
declare class AdminClient {
    /**
     * @ignore
     */
    private api;
    private authProvider;
    tenant: string;
    database: string;
    /**
     * Creates a new AdminClient instance.
     * @param {Object} params - The parameters for creating a new client
     * @param {string} [params.path] - The base path for the Chroma API.
     * @returns {AdminClient} A new AdminClient instance.
     *
     * @example
     * ```typescript
     * const client = new AdminClient({
     *   path: "http://localhost:8000"
     * });
     * ```
     */
    constructor({ path, fetchOptions, auth, tenant, database, }?: {
        path?: string;
        fetchOptions?: RequestInit;
        auth?: AuthOptions;
        tenant?: string;
        database?: string;
    });
    /**
     * Sets the tenant and database for the client.
     *
     * @param {Object} params - The parameters for setting tenant and database.
     * @param {string} params.tenant - The name of the tenant.
     * @param {string} params.database - The name of the database.
     *
     * @returns {Promise<void>} A promise that returns nothing
     * @throws {Error} Any issues
     *
     * @example
     * ```typescript
     * await adminClient.setTenant({
     *   tenant: "my_tenant",
     *   database: "my_database",
     * });
     * ```
     */
    setTenant({ tenant, database, }: {
        tenant: string;
        database?: string;
    }): Promise<void>;
    /**
     * Sets the database for the client.
     *
     * @param {Object} params - The parameters for setting the database.
     * @param {string} params.database - The name of the database.
     *
     * @returns {Promise<void>} A promise that returns nothing
     * @throws {Error} Any issues
     *
     * @example
     * ```typescript
     * await adminClient.setDatabase({
     *   database: "my_database",
     * });
     * ```
     */
    setDatabase({ database, }: {
        database?: string;
    }): Promise<void>;
    /**
     * Creates a new tenant with the specified properties.
     *
     * @param {Object} params - The parameters for creating a new tenant.
     * @param {string} params.name - The name of the tenant.
     *
     * @returns {Promise<Tenant>} A promise that resolves to the created tenant.
     * @throws {Error} If there is an issue creating the tenant.
     *
     * @example
     * ```typescript
     * await adminClient.createTenant({
     *   name: "my_tenant",
     * });
     * ```
     */
    createTenant({ name }: {
        name: string;
    }): Promise<Tenant>;
    /**
     * Gets a tenant with the specified properties.
     *
     * @param {Object} params - The parameters for getting a tenant.
     * @param {string} params.name - The name of the tenant.
     *
     * @returns {Promise<Tenant>} A promise that resolves to the tenant.
     * @throws {Error} If there is an issue getting the tenant.
     *
     * @example
     * ```typescript
     * await adminClient.getTenant({
     *   name: "my_tenant",
     * });
     * ```
     */
    getTenant({ name }: {
        name: string;
    }): Promise<Tenant>;
    /**
     * Creates a new database with the specified properties.
     *
     * @param {Object} params - The parameters for creating a new database.
     * @param {string} params.name - The name of the database.
     * @param {string} params.tenantName - The name of the tenant.
     *
     * @returns {Promise<Database>} A promise that resolves to the created database.
     * @throws {Error} If there is an issue creating the database.
     *
     * @example
     * ```typescript
     * await adminClient.createDatabase({
     *   name: "my_database",
     *   tenantName: "my_tenant",
     * });
     * ```
     */
    createDatabase({ name, tenantName, }: {
        name: string;
        tenantName: string;
    }): Promise<Database>;
    /**
     * Gets a database with the specified properties.
     *
     * @param {Object} params - The parameters for getting a database.
     * @param {string} params.name - The name of the database.
     * @param {string} params.tenantName - The name of the tenant.
     *
     * @returns {Promise<Database>} A promise that resolves to the database.
     * @throws {Error} If there is an issue getting the database.
     *
     * @example
     * ```typescript
     * await adminClient.getDatabase({
     *   name: "my_database",
     *   tenantName: "my_tenant",
     * });
     * ```
     */
    getDatabase({ name, tenantName, }: {
        name: string;
        tenantName: string;
    }): Promise<Database>;
}

interface CloudClientParams {
    apiKey?: string;
    database?: string;
    tenant?: string;
    cloudHost?: string;
    cloudPort?: string;
}
declare class CloudClient extends ChromaClient {
    constructor({ apiKey, database, tenant, cloudHost, cloudPort, }: CloudClientParams);
}

declare class OpenAIEmbeddingFunction implements IEmbeddingFunction {
    private api_key;
    private org_id;
    private model;
    private openaiApi?;
    constructor({ openai_api_key, openai_model, openai_organization_id, }: {
        openai_api_key: string;
        openai_model?: string;
        openai_organization_id?: string;
    });
    private loadClient;
    generate(texts: string[]): Promise<number[][]>;
    /** @ignore */
    static import(): Promise<{
        openai: typeof openai;
        version: string;
    }>;
}

declare class CohereEmbeddingFunction implements IEmbeddingFunction {
    private cohereAiApi?;
    private model;
    private apiKey;
    constructor({ cohere_api_key, model, }: {
        cohere_api_key: string;
        model?: string;
    });
    private initCohereClient;
    generate(texts: string[]): Promise<number[][]>;
}

declare class TransformersEmbeddingFunction implements IEmbeddingFunction {
    private pipelinePromise?;
    private transformersApi;
    private model;
    private revision;
    private quantized;
    private progress_callback;
    /**
     * TransformersEmbeddingFunction constructor.
     * @param options The configuration options.
     * @param options.model The model to use to calculate embeddings. Defaults to 'Xenova/all-MiniLM-L6-v2', which is an ONNX port of `sentence-transformers/all-MiniLM-L6-v2`.
     * @param options.revision The specific model version to use (can be a branch, tag name, or commit id). Defaults to 'main'.
     * @param options.quantized Whether to load the 8-bit quantized version of the model. Defaults to `false`.
     * @param options.progress_callback If specified, this function will be called during model construction, to provide the user with progress updates.
     */
    constructor({ model, revision, quantized, progress_callback, }?: {
        model?: string;
        revision?: string;
        quantized?: boolean;
        progress_callback?: Function | null;
    });
    generate(texts: string[]): Promise<number[][]>;
    private loadClient;
    /** @ignore */
    static import(): Promise<{
        pipeline: typeof _xenova_transformers;
    }>;
}

declare class DefaultEmbeddingFunction implements IEmbeddingFunction {
    private pipelinePromise?;
    private transformersApi;
    private model;
    private revision;
    private quantized;
    private progress_callback;
    /**
     * DefaultEmbeddingFunction constructor.
     * @param options The configuration options.
     * @param options.model The model to use to calculate embeddings. Defaults to 'Xenova/all-MiniLM-L6-v2', which is an ONNX port of `sentence-transformers/all-MiniLM-L6-v2`.
     * @param options.revision The specific model version to use (can be a branch, tag name, or commit id). Defaults to 'main'.
     * @param options.quantized Whether to load the 8-bit quantized version of the model. Defaults to `false`.
     * @param options.progress_callback If specified, this function will be called during model construction, to provide the user with progress updates.
     */
    constructor({ model, revision, quantized, progress_callback, }?: {
        model?: string;
        revision?: string;
        quantized?: boolean;
        progress_callback?: Function | null;
    });
    generate(texts: string[]): Promise<number[][]>;
    private loadClient;
    /** @ignore */
    static import(): Promise<{
        pipeline: typeof chromadb_default_embed;
    }>;
}

declare class HuggingFaceEmbeddingServerFunction implements IEmbeddingFunction {
    private url;
    constructor({ url }: {
        url: string;
    });
    generate(texts: string[]): Promise<any>;
}

declare class JinaEmbeddingFunction implements IEmbeddingFunction {
    private model_name;
    private api_url;
    private headers;
    constructor({ jinaai_api_key, model_name, }: {
        jinaai_api_key: string;
        model_name?: string;
    });
    generate(texts: string[]): Promise<any[]>;
}

declare class GoogleGenerativeAiEmbeddingFunction implements IEmbeddingFunction {
    private api_key;
    private model;
    private googleGenAiApi?;
    private taskType;
    constructor({ googleApiKey, model, taskType, }: {
        googleApiKey: string;
        model?: string;
        taskType?: string;
    });
    private loadClient;
    generate(texts: string[]): Promise<any>;
    /** @ignore */
    static import(): Promise<{
        googleGenAi: typeof _google_generative_ai;
    }>;
}

declare class OllamaEmbeddingFunction implements IEmbeddingFunction {
    private readonly url;
    private readonly model;
    constructor({ url, model }: {
        url: string;
        model: string;
    });
    generate(texts: string[]): Promise<number[][]>;
}

export { AddRecordsParams, AdminClient, ChromaClient, ChromaClientParams, CloudClient, CohereEmbeddingFunction, CollectionMetadata, CollectionParams, CollectionType, CreateCollectionParams, DefaultEmbeddingFunction, DeleteCollectionParams, DeleteParams, Document, Documents, Embedding, Embeddings, GetCollectionParams, GetOrCreateCollectionParams, GetParams, GetResponse, GoogleGenerativeAiEmbeddingFunction, HuggingFaceEmbeddingServerFunction, ID, IDs, IEmbeddingFunction, IncludeEnum, JinaEmbeddingFunction, ListCollectionsParams, Metadata, Metadatas, ModifyCollectionParams, OllamaEmbeddingFunction, OpenAIEmbeddingFunction, PeekParams, QueryRecordsParams, QueryResponse, TransformersEmbeddingFunction, UpdateRecordsParams, UpsertRecordsParams, Where, WhereDocument };
