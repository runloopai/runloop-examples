import { type AgentParamsBase, AgentRunner, AgentWorker, type TaskHandler } from "@llamaindex/core/agent";
import type { JSONObject, JSONValue } from "@llamaindex/core/global";
import type { ChatResponse, LLM } from "@llamaindex/core/llms";
export type ReACTAgentParams = AgentParamsBase<LLM>;
type BaseReason = {
    type: unknown;
};
type ObservationReason = BaseReason & {
    type: "observation";
    observation: JSONValue;
};
type ActionReason = BaseReason & {
    type: "action";
    thought: string;
    action: string;
    input: JSONObject;
};
type ResponseReason = BaseReason & {
    type: "response";
    thought: string;
    response: ChatResponse;
};
type Reason = ObservationReason | ActionReason | ResponseReason;
type ReACTAgentStore = {
    reasons: Reason[];
};
export declare class ReACTAgentWorker extends AgentWorker<LLM, ReACTAgentStore> {
    taskHandler: TaskHandler<LLM<object, object>, ReACTAgentStore>;
}
export declare class ReActAgent extends AgentRunner<LLM, ReACTAgentStore> {
    constructor(params: ReACTAgentParams);
    createStore(): {
        reasons: never[];
    };
    static taskHandler: TaskHandler<LLM, ReACTAgentStore>;
}
export {};
