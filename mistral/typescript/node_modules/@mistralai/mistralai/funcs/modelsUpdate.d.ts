import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import { SDKError } from "../models/errors/sdkerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { Result } from "../types/fp.js";
/**
 * Update Fine Tuned Model
 *
 * @remarks
 * Update a model name or description.
 */
export declare function modelsUpdate(client: MistralCore, request: operations.JobsApiRoutesFineTuningUpdateFineTunedModelRequest, options?: RequestOptions): Promise<Result<components.FTModelOut, SDKError | SDKValidationError | UnexpectedClientError | InvalidRequestError | RequestAbortedError | RequestTimeoutError | ConnectionError>>;
//# sourceMappingURL=modelsUpdate.d.ts.map