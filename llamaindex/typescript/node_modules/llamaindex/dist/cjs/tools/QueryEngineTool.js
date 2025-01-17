"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QueryEngineTool", {
    enumerable: true,
    get: function() {
        return QueryEngineTool;
    }
});
const DEFAULT_NAME = "query_engine_tool";
const DEFAULT_DESCRIPTION = "Useful for running a natural language query against a knowledge base and get back a natural language response.";
const DEFAULT_PARAMETERS = {
    type: "object",
    properties: {
        query: {
            type: "string",
            description: "The query to search for"
        }
    },
    required: [
        "query"
    ]
};
class QueryEngineTool {
    queryEngine;
    metadata;
    constructor({ queryEngine, metadata }){
        this.queryEngine = queryEngine;
        this.metadata = {
            name: metadata?.name ?? DEFAULT_NAME,
            description: metadata?.description ?? DEFAULT_DESCRIPTION,
            parameters: metadata?.parameters ?? DEFAULT_PARAMETERS
        };
    }
    async call({ query }) {
        const response = await this.queryEngine.query({
            query
        });
        return response.message.content;
    }
}
