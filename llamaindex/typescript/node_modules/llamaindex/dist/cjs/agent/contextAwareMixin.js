"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "withContextAwareness", {
    enumerable: true,
    get: function() {
        return withContextAwareness;
    }
});
const _schema = require("@llamaindex/core/schema");
function withContextAwareness(Base) {
    return class ContextAwareAgent extends Base {
        contextRetriever;
        retrievedContext = null;
        constructor(params){
            super(params);
            this.contextRetriever = params.contextRetriever;
        }
        async retrieveContext(query) {
            const nodes = await this.contextRetriever.retrieve({
                query
            });
            return nodes.map((node)=>node.node.getContent(_schema.MetadataMode.NONE)).join("\n");
        }
        async injectContext(context) {
            const systemMessage = this.chatHistory.find((msg)=>msg.role === "system");
            if (systemMessage) {
                systemMessage.content = `${context}\n\n${systemMessage.content}`;
            } else {
                this.chatHistory.unshift({
                    role: "system",
                    content: context
                });
            }
        }
        async chat(params) {
            const context = await this.retrieveContext(params.message);
            await this.injectContext(context);
            if ("stream" in params && params.stream === true) {
                return super.chat(params);
            } else {
                return super.chat(params);
            }
        }
    };
}
