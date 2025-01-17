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
var retries_1 = require("../retries");
var errors_1 = require("../../errors");
describe('RetryOnServerFailure', function () {
    test("Should print 'Max retries' error stmt when response fails to succeed after maxRetries is reached", function () { return __awaiter(void 0, void 0, void 0, function () {
        var fakeAsyncFn, retryWrapper, errorResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakeAsyncFn = jest
                        .fn()
                        .mockImplementation(function () { return Promise.resolve(errors_1.PineconeInternalServerError); });
                    retryWrapper = new retries_1.RetryOnServerFailure(fakeAsyncFn, 2);
                    errorResult = function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, retryWrapper.execute()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, expect(errorResult).rejects.toThrowError(errors_1.PineconeMaxRetriesExceededError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Should act the same as above with PineconeUnavailableError', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fakeAsyncFn, retryWrapper, errorResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakeAsyncFn = jest
                        .fn()
                        .mockImplementation(function () { return Promise.resolve(errors_1.PineconeUnavailableError); });
                    retryWrapper = new retries_1.RetryOnServerFailure(fakeAsyncFn, 2);
                    errorResult = function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, retryWrapper.execute()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, expect(errorResult).rejects.toThrowError(errors_1.PineconeMaxRetriesExceededError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Should return response if successful and status code is not 5xx', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fakeAsyncFn, retryWrapper, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakeAsyncFn = jest
                        .fn()
                        .mockImplementation(function () { return Promise.resolve({}); });
                    retryWrapper = new retries_1.RetryOnServerFailure(fakeAsyncFn, 2);
                    return [4 /*yield*/, retryWrapper.execute()];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({});
                    return [2 /*return*/];
            }
        });
    }); });
    test('If maxRetries exceeds 10, throw error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fakeAsyncFn, toThrow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakeAsyncFn = jest
                        .fn()
                        .mockImplementation(function () { return Promise.resolve({}); });
                    toThrow = function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            new retries_1.RetryOnServerFailure(fakeAsyncFn, 11);
                            return [2 /*return*/];
                        });
                    }); };
                    return [4 /*yield*/, expect(toThrow()).rejects.toThrowError('Max retries cannot exceed 10')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Should retry when first encounter error, then succeed when eventually get good response back', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fakeAsyncFn, retryWrapper, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakeAsyncFn = jest
                        .fn()
                        .mockImplementationOnce(function () {
                        return Promise.resolve({ name: 'PineconeInternalServerError', status: 500 });
                    }) // 1x failure to trigger a retry
                        .mockImplementationOnce(function () { return Promise.resolve({ status: 200 }); });
                    retryWrapper = new retries_1.RetryOnServerFailure(fakeAsyncFn, 2);
                    return [4 /*yield*/, retryWrapper.execute()];
                case 1:
                    result = _a.sent();
                    expect(result.status).toBe(200);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('calculateRetryDelay', function () {
    test('Should return a number < maxDelay', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () {
            return Promise.resolve({ PineconeUnavailableError: errors_1.PineconeUnavailableError });
        });
        var result = retryWrapper.calculateRetryDelay(3);
        expect(result).toBeLessThanOrEqual(20000);
    });
    test('Should never return a negative number', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () {
            return Promise.resolve({ PineconeUnavailableError: errors_1.PineconeUnavailableError });
        });
        var result = retryWrapper.calculateRetryDelay(3);
        expect(result).toBeGreaterThan(0);
    });
});
describe('isRetryError', function () {
    test('Should return true if response is PineconeUnavailableError', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () {
            return Promise.resolve({ name: 'PineconeUnavailableError' });
        });
        var result = retryWrapper.isRetryError({
            name: 'PineconeUnavailableError',
        });
        expect(result).toBe(true);
    });
    test('Should return false if response is not PineconeUnavailableError or PineconeInternalServerError', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () {
            return Promise.resolve({ name: 'MadeUpName' });
        });
        var result = retryWrapper.isRetryError({ name: 'MadeUpName' });
        expect(result).toBe(false);
    });
    test('Should return true if response.status >= 500', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () {
            return Promise.resolve({ status: 500 });
        });
        var result = retryWrapper.isRetryError({ status: 500 });
        expect(result).toBe(true);
    });
});
describe('shouldStopRetrying', function () {
    test('Should return true for non-retryable status code', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () { return Promise.resolve({}); });
        var result = retryWrapper['shouldStopRetrying']({ status: 400 });
        expect(result).toBe(true);
    });
    test('Should return true for non-retryable error name', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () { return Promise.resolve({}); });
        var result = retryWrapper['shouldStopRetrying']({
            name: 'SomeOtherError',
        });
        expect(result).toBe(true);
    });
    test('Should return false for retryable error name PineconeUnavailableError', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () { return Promise.resolve({}); });
        var result = retryWrapper['shouldStopRetrying']({
            name: 'PineconeUnavailableError',
        });
        expect(result).toBe(false);
    });
    test('Should return false for retryable error name PineconeInternalServerError', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () { return Promise.resolve({}); });
        var result = retryWrapper['shouldStopRetrying']({
            name: 'PineconeInternalServerError',
        });
        expect(result).toBe(false);
    });
    test('Should return false for retryable status code', function () {
        var retryWrapper = new retries_1.RetryOnServerFailure(function () { return Promise.resolve({}); });
        var result = retryWrapper['shouldStopRetrying']({ status: 500 });
        expect(result).toBe(false);
    });
});
//# sourceMappingURL=retries.test.js.map