import * as tasks from "./tasks";
import type { Options } from "./types";
import type { DistributiveOmit } from "./utils/distributive-omit";
type Task = typeof tasks;
type TaskWithNoAccessToken = {
    [key in keyof Task]: (args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken">, options?: Parameters<Task[key]>[1]) => ReturnType<Task[key]>;
};
type TaskWithNoAccessTokenNoEndpointUrl = {
    [key in keyof Task]: (args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken" | "endpointUrl">, options?: Parameters<Task[key]>[1]) => ReturnType<Task[key]>;
};
export declare class HfInference {
    private readonly accessToken;
    private readonly defaultOptions;
    constructor(accessToken?: string, defaultOptions?: Options);
    /**
     * Returns copy of HfInference tied to a specified endpoint.
     */
    endpoint(endpointUrl: string): HfInferenceEndpoint;
}
export declare class HfInferenceEndpoint {
    constructor(endpointUrl: string, accessToken?: string, defaultOptions?: Options);
}
export interface HfInference extends TaskWithNoAccessToken {
}
export interface HfInferenceEndpoint extends TaskWithNoAccessTokenNoEndpointUrl {
}
export {};
//# sourceMappingURL=HfInference.d.ts.map