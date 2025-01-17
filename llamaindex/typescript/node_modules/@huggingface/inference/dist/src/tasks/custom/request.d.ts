import type { InferenceTask, Options, RequestArgs } from "../../types";
/**
 * Primitive to make custom calls to Inference Endpoints
 */
export declare function request<T>(args: RequestArgs, options?: Options & {
    /** When a model can be used for multiple tasks, and we want to run a non-default task */
    task?: string | InferenceTask;
    /** To load default model if needed */
    taskHint?: InferenceTask;
    /** Is chat completion compatible */
    chatCompletion?: boolean;
}): Promise<T>;
//# sourceMappingURL=request.d.ts.map