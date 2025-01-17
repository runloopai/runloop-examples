import type { BaseArgs, Options } from "../../types";
import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";
/**
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export declare function chatCompletion(args: BaseArgs & ChatCompletionInput, options?: Options): Promise<ChatCompletionOutput>;
//# sourceMappingURL=chatCompletion.d.ts.map