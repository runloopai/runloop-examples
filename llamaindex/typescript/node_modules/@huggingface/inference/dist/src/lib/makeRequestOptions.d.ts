import type { InferenceTask, Options, RequestArgs } from "../types";
/**
 * Helper that prepares request arguments
 */
export declare function makeRequestOptions(args: RequestArgs & {
    data?: Blob | ArrayBuffer;
    stream?: boolean;
}, options?: Options & {
    /** When a model can be used for multiple tasks, and we want to run a non-default task */
    forceTask?: string | InferenceTask;
    /** To load default model if needed */
    taskHint?: InferenceTask;
    chatCompletion?: boolean;
}): Promise<{
    url: string;
    info: RequestInit;
}>;
//# sourceMappingURL=makeRequestOptions.d.ts.map