import { BaseNode } from '../../schema/dist/index.cjs';
import * as ___llms from '../../llms/dist/index.cjs';
import { LLMChat, LLM } from '../../llms/dist/index.cjs';

declare function wrapEventCaller<This, Result, Args extends unknown[]>(originalMethod: (this: This, ...args: Args) => Result, context: ClassMethodDecoratorContext<object>): (this: This, ...args: Args) => Result;

declare function lazyInitHash(value: ClassAccessorDecoratorTarget<BaseNode, string>, _context: ClassAccessorDecoratorContext): ClassAccessorDecoratorResult<BaseNode, string>;

declare function wrapLLMEvent<AdditionalChatOptions extends object = object, AdditionalMessageOptions extends object = object>(originalMethod: LLMChat<AdditionalChatOptions, AdditionalMessageOptions>["chat"], _context: ClassMethodDecoratorContext): (this: LLM<AdditionalChatOptions, AdditionalMessageOptions>, params: ___llms.LLMChatParamsStreaming<AdditionalChatOptions, object> | ___llms.LLMChatParamsNonStreaming<AdditionalChatOptions, object>) => ReturnType<LLMChat<AdditionalChatOptions, AdditionalMessageOptions>["chat"]>;

export { lazyInitHash, wrapEventCaller, wrapLLMEvent };
