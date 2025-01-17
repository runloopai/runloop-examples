import { MetadataMode } from "@llamaindex/core/schema";
/**
 * ContextAwareAgentRunner enhances the base AgentRunner with the ability to retrieve and inject relevant context
 * for each query. This allows the agent to access and utilize appropriate information from a given index or retriever,
 * providing more informed and context-specific responses to user queries.
 */ export function withContextAwareness(Base) {
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
            return nodes.map((node)=>node.node.getContent(MetadataMode.NONE)).join("\n");
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
