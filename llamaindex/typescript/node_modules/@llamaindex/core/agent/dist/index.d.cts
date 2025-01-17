import { BaseChatEngine, NonStreamingChatEngineParams, StreamingChatEngineParams } from '../../chat-engine/dist/index.cjs';
import { LLM, MessageContent, BaseToolWithCall, ToolOutput, ChatMessage, ChatResponse, ChatResponseChunk, BaseTool, ToolCall, PartialToolCall, TextChatMessage, ToolCallLLMMessageOptions } from '../../llms/dist/index.cjs';
import { ObjectRetriever } from '../../objects/dist/index.cjs';
import { EngineResponse } from '../../schema/dist/index.cjs';
import { Logger } from '@llamaindex/env';
import { UUID } from '../../global/dist/index.cjs';

type AgentTaskContext<Model extends LLM, Store extends object = object, AdditionalMessageOptions extends object = Model extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = {
    readonly stream: boolean;
    readonly toolCallCount: number;
    readonly llm: Model;
    readonly getTools: (input: MessageContent) => BaseToolWithCall[] | Promise<BaseToolWithCall[]>;
    readonly additionalChatOptions: Partial<AdditionalChatOptions>;
    shouldContinue: (taskStep: Readonly<TaskStep<Model, Store, AdditionalMessageOptions>>) => boolean;
    store: {
        toolOutputs: ToolOutput[];
        messages: ChatMessage<AdditionalMessageOptions>[];
    } & Store;
    logger: Readonly<Logger>;
};
type TaskStep<Model extends LLM = LLM, Store extends object = object, AdditionalMessageOptions extends object = Model extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = {
    id: UUID;
    context: AgentTaskContext<Model, Store, AdditionalMessageOptions, AdditionalChatOptions>;
    prevStep: TaskStep<Model, Store, AdditionalMessageOptions, AdditionalChatOptions> | null;
    nextSteps: Set<TaskStep<Model, Store, AdditionalMessageOptions, AdditionalChatOptions>>;
};
type TaskStepOutput<Model extends LLM, Store extends object = object, AdditionalMessageOptions extends object = Model extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = {
    taskStep: TaskStep<Model, Store, AdditionalMessageOptions, AdditionalChatOptions>;
    output: ChatResponse<AdditionalMessageOptions> | ReadableStream<ChatResponseChunk<AdditionalMessageOptions>>;
    isLast: boolean;
};
type TaskHandler<Model extends LLM, Store extends object = object, AdditionalMessageOptions extends object = Model extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = (step: TaskStep<Model, Store, AdditionalMessageOptions, AdditionalChatOptions>, enqueueOutput: (taskOutput: TaskStepOutput<Model, Store, AdditionalMessageOptions, AdditionalChatOptions>) => void) => Promise<void>;
type AgentStartEvent = {
    startStep: TaskStep;
};
type AgentEndEvent = {
    endStep: TaskStep;
};

type AgentRunnerParams<AI extends LLM, Store extends object = object, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = {
    llm: AI;
    chatHistory: ChatMessage<AdditionalMessageOptions>[];
    systemPrompt: MessageContent | null;
    runner: AgentWorker<AI, Store, AdditionalMessageOptions, AdditionalChatOptions>;
    tools: BaseToolWithCall[] | ((query: MessageContent) => Promise<BaseToolWithCall[]>);
    verbose: boolean;
};
type AgentParamsBase<AI extends LLM, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = {
    llm?: AI;
    chatHistory?: ChatMessage<AdditionalMessageOptions>[];
    systemPrompt?: MessageContent;
    verbose?: boolean;
    tools: BaseToolWithCall[];
    additionalChatOptions?: AdditionalChatOptions;
} | {
    llm?: AI;
    chatHistory?: ChatMessage<AdditionalMessageOptions>[];
    systemPrompt?: MessageContent;
    verbose?: boolean;
    toolRetriever: ObjectRetriever<BaseToolWithCall>;
    additionalChatOptions?: AdditionalChatOptions;
};
/**
 * Worker will schedule tasks and handle the task execution
 */
declare abstract class AgentWorker<AI extends LLM, Store extends object = object, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> {
    #private;
    abstract taskHandler: TaskHandler<AI, Store, AdditionalMessageOptions, AdditionalChatOptions>;
    createTask(query: MessageContent, context: AgentTaskContext<AI, Store, AdditionalMessageOptions, AdditionalChatOptions>): ReadableStream<TaskStepOutput<AI, Store, AdditionalMessageOptions, AdditionalChatOptions>>;
    [Symbol.toStringTag]: string;
}
/**
 * Runner will manage the task execution and provide a high-level API for the user
 */
declare abstract class AgentRunner<AI extends LLM, Store extends object = object, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> extends BaseChatEngine {
    #private;
    abstract createStore(): Store;
    static defaultCreateStore(): object;
    static defaultTaskHandler: TaskHandler<LLM>;
    protected constructor(params: AgentRunnerParams<AI, Store, AdditionalMessageOptions, AdditionalChatOptions>);
    get llm(): AI;
    get chatHistory(): ChatMessage<AdditionalMessageOptions>[];
    get verbose(): boolean;
    reset(): void;
    getTools(query: MessageContent): Promise<BaseToolWithCall[]> | BaseToolWithCall[];
    static shouldContinue<AI extends LLM, Store extends object = object, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never>(task: Readonly<TaskStep<AI, Store, AdditionalMessageOptions>>): boolean;
    createTask(message: MessageContent, stream?: boolean, verbose?: boolean | undefined, chatHistory?: ChatMessage<AdditionalMessageOptions>[], additionalChatOptions?: AdditionalChatOptions): ReadableStream<TaskStepOutput<AI, Store, AdditionalMessageOptions, AdditionalChatOptions>>;
    chat(params: NonStreamingChatEngineParams<AdditionalMessageOptions, AdditionalChatOptions>): Promise<EngineResponse>;
    chat(params: StreamingChatEngineParams<AdditionalMessageOptions, AdditionalChatOptions>): Promise<ReadableStream<EngineResponse>>;
}

type LLMParamsBase<AI extends LLM, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = AgentParamsBase<AI, AdditionalMessageOptions, AdditionalChatOptions>;
type LLMParamsWithTools<AI extends LLM, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = LLMParamsBase<AI, AdditionalMessageOptions, AdditionalChatOptions> & {
    tools: BaseToolWithCall[];
};
type LLMParamsWithToolRetriever<AI extends LLM, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = LLMParamsBase<AI, AdditionalMessageOptions, AdditionalChatOptions> & {
    toolRetriever: ObjectRetriever<BaseToolWithCall>;
};
type LLMAgentParams<AI extends LLM, AdditionalMessageOptions extends object = AI extends LLM<object, infer AdditionalMessageOptions> ? AdditionalMessageOptions : never, AdditionalChatOptions extends object = object> = LLMParamsWithTools<AI, AdditionalMessageOptions, AdditionalChatOptions> | LLMParamsWithToolRetriever<AI, AdditionalMessageOptions, AdditionalChatOptions>;
declare class LLMAgentWorker extends AgentWorker<LLM> {
    taskHandler: TaskHandler<LLM<object, object>>;
}
declare class LLMAgent extends AgentRunner<LLM> {
    constructor(params: LLMAgentParams<LLM>);
    createStore: typeof AgentRunner.defaultCreateStore;
    taskHandler: TaskHandler<LLM<object, object>>;
}

type StepToolsResponseParams<Model extends LLM> = {
    response: ChatResponse<ToolCallLLMMessageOptions>;
    tools: BaseTool[];
    step: Parameters<TaskHandler<Model, object, ToolCallLLMMessageOptions>>[0];
    enqueueOutput: Parameters<TaskHandler<Model, object, ToolCallLLMMessageOptions>>[1];
};
type StepToolsStreamingResponseParams<Model extends LLM> = Omit<StepToolsResponseParams<Model>, "response"> & {
    response: AsyncIterable<ChatResponseChunk<ToolCallLLMMessageOptions>>;
};
declare function stepToolsStreaming<Model extends LLM>({ response, tools, step, enqueueOutput, }: StepToolsStreamingResponseParams<Model>): Promise<void>;
declare function stepTools<Model extends LLM>({ response, tools, step, enqueueOutput, }: StepToolsResponseParams<Model>): Promise<void>;
declare function callTool(tool: BaseTool | undefined, toolCall: ToolCall | PartialToolCall, logger: Logger): Promise<ToolOutput>;
declare function consumeAsyncIterable<Options extends object>(input: ChatMessage<Options>, previousContent?: string): Promise<ChatMessage<Options>>;
declare function consumeAsyncIterable<Options extends object>(input: AsyncIterable<ChatResponseChunk<Options>>, previousContent?: string): Promise<TextChatMessage<Options>>;
declare function createReadableStream<T>(asyncIterable: AsyncIterable<T>): ReadableStream<T>;
declare function validateAgentParams<AI extends LLM>(params: AgentParamsBase<AI>): void;

export { type AgentEndEvent, type AgentParamsBase, AgentRunner, type AgentStartEvent, AgentWorker, LLMAgent, type LLMAgentParams, LLMAgentWorker, type TaskHandler, type TaskStep, callTool, consumeAsyncIterable, createReadableStream, stepTools, stepToolsStreaming, validateAgentParams };
