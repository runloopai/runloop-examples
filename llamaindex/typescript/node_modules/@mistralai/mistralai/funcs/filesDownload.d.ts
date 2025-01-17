import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import { SDKError } from "../models/errors/sdkerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { Result } from "../types/fp.js";
/**
 * Download File
 *
 * @remarks
 * Download a file
 */
export declare function filesDownload(client: MistralCore, request: operations.FilesApiRoutesDownloadFileRequest, options?: RequestOptions): Promise<Result<ReadableStream<Uint8Array>, SDKError | SDKValidationError | UnexpectedClientError | InvalidRequestError | RequestAbortedError | RequestTimeoutError | ConnectionError>>;
//# sourceMappingURL=filesDownload.d.ts.map