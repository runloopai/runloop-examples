"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryOnServerFailure = void 0;
var errors_1 = require("../errors");
/* Retry asynchronous operations.
 *
 * @param maxRetries - The maximum number of retries to attempt.
 * @param asyncFn - The asynchronous function to retry.
 */
var RetryOnServerFailure = /** @class */ (function () {
    function RetryOnServerFailure(asyncFn, maxRetries) {
        /*
         * Calculate the delay time for retrying an operation.
         *
         * @param attempt: The # of times the operation has been attempted.
         * @param baseDelay: The base delay time in milliseconds.
         * @param maxDelay: The maximum delay time in milliseconds.
         * @param jitterFactor: The magnitude of jitter relative to the delay.
         */
        this.calculateRetryDelay = function (attempt, baseDelay, maxDelay, jitterFactor) {
            if (baseDelay === void 0) { baseDelay = 200; }
            if (maxDelay === void 0) { maxDelay = 20000; }
            if (jitterFactor === void 0) { jitterFactor = 0.25; }
            var delay = baseDelay * Math.pow(2, attempt); // Exponential (baseDelay * 2^attempt)
            // Apply jitter as a random percentage of the original delay; e.g.: if `jitterFactor` = 0.25 and `baseDelay` = 1000,
            // then `jitter` is 25% of `baseDelay`
            var jitter = delay * jitterFactor * (Math.random() - 0.5);
            delay += jitter;
            // Ensure delay is not negative or greater than maxDelay
            return Math.min(maxDelay, Math.max(0, delay));
        };
        if (maxRetries) {
            this.maxRetries = maxRetries;
        }
        else {
            this.maxRetries = 3;
        }
        if (this.maxRetries > 10) {
            throw new Error('Max retries cannot exceed 10');
        }
        this.asyncFn = asyncFn;
    }
    RetryOnServerFailure.prototype.execute = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var attempt, response, error_1, mappedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.maxRetries < 1) {
                            return [2 /*return*/, this.asyncFn.apply(this, args)];
                        }
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < this.maxRetries)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.asyncFn.apply(this, args)];
                    case 3:
                        response = _a.sent();
                        // Return immediately if the response is not a retryable error
                        if (!this.isRetryError(response)) {
                            return [2 /*return*/, response];
                        }
                        throw response; // Will catch this in next line
                    case 4:
                        error_1 = _a.sent();
                        mappedError = this.mapErrorIfNeeded(error_1);
                        // If the error is not retryable, throw it immediately
                        if (this.shouldStopRetrying(mappedError)) {
                            throw mappedError;
                        }
                        // On the last retry, throw a MaxRetriesExceededError
                        if (attempt === this.maxRetries - 1) {
                            throw new errors_1.PineconeMaxRetriesExceededError(this.maxRetries);
                        }
                        // Wait before retrying
                        return [4 /*yield*/, this.delay(attempt + 1)];
                    case 5:
                        // Wait before retrying
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7: 
                    // This fallback is unnecessary, but included for type safety
                    throw new errors_1.PineconeMaxRetriesExceededError(this.maxRetries);
                }
            });
        });
    };
    RetryOnServerFailure.prototype.isRetryError = function (response) {
        if (response) {
            if (response.name &&
                ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(response.name)) {
                return true;
            }
            if (response.status && response.status >= 500) {
                return true;
            }
        }
        return false;
    };
    RetryOnServerFailure.prototype.delay = function (attempt) {
        return __awaiter(this, void 0, void 0, function () {
            var delayTime;
            return __generator(this, function (_a) {
                delayTime = this.calculateRetryDelay(attempt);
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, delayTime); })];
            });
        });
    };
    RetryOnServerFailure.prototype.mapErrorIfNeeded = function (error) {
        if (error === null || error === void 0 ? void 0 : error.status) {
            return (0, errors_1.mapHttpStatusError)(error);
        }
        return error; // Return original error if no mapping is needed
    };
    RetryOnServerFailure.prototype.shouldStopRetrying = function (error) {
        if (error.status) {
            return error.status < 500;
        }
        if (error.name) {
            return (error.name !== 'PineconeUnavailableError' &&
                error.name !== 'PineconeInternalServerError');
        }
        return true;
    };
    return RetryOnServerFailure;
}());
exports.RetryOnServerFailure = RetryOnServerFailure;
//# sourceMappingURL=retries.js.map