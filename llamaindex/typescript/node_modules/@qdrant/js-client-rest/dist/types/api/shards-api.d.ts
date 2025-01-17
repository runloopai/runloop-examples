import { Client } from '../api-client.js';
export declare function createShardsApi(client: Client): {
    /**
     * Create shard key
     */
    readonly createShardKey: import("@qdrant/openapi-typescript-fetch").TypedFetch<{
        parameters: {
            query?: {
                timeout?: number | undefined;
            } | undefined;
            path: {
                collection_name: string;
            };
        };
        requestBody?: {
            content: {
                "application/json": {
                    shard_key: string | number;
                    shards_number?: number | null | undefined;
                    replication_factor?: number | null | undefined;
                    placement?: number[] | null | undefined;
                };
            };
        } | undefined;
        responses: {
            200: {
                content: {
                    "application/json": {
                        time?: number | undefined;
                        status?: string | undefined;
                        result?: boolean | undefined;
                    };
                };
            };
            default: {
                content: {
                    "application/json": {
                        time?: number | undefined;
                        status?: {
                            error?: string | undefined;
                        } | undefined;
                        result?: Record<string, unknown> | null | undefined;
                    };
                };
            };
            "4XX": {
                content: {
                    "application/json": {
                        time?: number | undefined;
                        status?: {
                            error?: string | undefined;
                        } | undefined;
                        result?: Record<string, unknown> | null | undefined;
                    };
                };
            };
        };
    }>;
    /**
     * Delete shard key
     */
    readonly deleteShardKey: import("@qdrant/openapi-typescript-fetch").TypedFetch<{
        parameters: {
            query?: {
                timeout?: number | undefined;
            } | undefined;
            path: {
                collection_name: string;
            };
        };
        requestBody?: {
            content: {
                "application/json": {
                    shard_key: string | number;
                };
            };
        } | undefined;
        responses: {
            200: {
                content: {
                    "application/json": {
                        time?: number | undefined;
                        status?: string | undefined;
                        result?: boolean | undefined;
                    };
                };
            };
            default: {
                content: {
                    "application/json": {
                        time?: number | undefined;
                        status?: {
                            error?: string | undefined;
                        } | undefined;
                        result?: Record<string, unknown> | null | undefined;
                    };
                };
            };
            "4XX": {
                content: {
                    "application/json": {
                        time?: number | undefined;
                        status?: {
                            error?: string | undefined;
                        } | undefined;
                        result?: Record<string, unknown> | null | undefined;
                    };
                };
            };
        };
    }>;
};
