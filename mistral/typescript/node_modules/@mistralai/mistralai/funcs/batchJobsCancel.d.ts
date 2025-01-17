import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import { SDKError } from "../models/errors/sdkerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { Result } from "../types/fp.js";
/**
 * Cancel Batch Job
 *
 * @remarks
 * Request the cancellation of a batch job.
 */
export declare function batchJobsCancel(client: MistralCore, request: operations.JobsApiRoutesBatchCancelBatchJobRequest, options?: RequestOptions): Promise<Result<components.BatchJobOut, SDKError | SDKValidationError | UnexpectedClientError | InvalidRequestError | RequestAbortedError | RequestTimeoutError | ConnectionError>>;
//# sourceMappingURL=batchJobsCancel.d.ts.map