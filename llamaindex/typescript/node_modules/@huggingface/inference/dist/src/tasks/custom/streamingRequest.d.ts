import type { InferenceTask, Options, RequestArgs } from "../../types";
/**
 * Primitive to make custom inference calls that expect server-sent events, and returns the response through a generator
 */
export declare function streamingRequest<T>(args: RequestArgs, options?: Options & {
    /** When a model can be used for multiple tasks, and we want to run a non-default task */
    task?: string | InferenceTask;
    /** To load default model if needed */
    taskHint?: InferenceTask;
    /** Is chat completion compatible */
    chatCompletion?: boolean;
}): AsyncGenerator<T>;
//# sourceMappingURL=streamingRequest.d.ts.map