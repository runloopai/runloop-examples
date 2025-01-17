"use strict";
/* This file tests both Upsert and Update operations. It additionally tests the RetryOnServerFailure implementation
 on the Upsert operation. */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../../index");
var test_helpers_1 = require("../../test-helpers");
var utils_1 = require("../../../utils");
var errors_1 = require("../../../errors");
var http_1 = __importDefault(require("http"));
var url_1 = require("url");
// todo: add pods
var pinecone, serverlessIndex, serverlessIndexName;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pinecone = new index_1.Pinecone();
                serverlessIndexName = (0, test_helpers_1.randomIndexName)('int-test-serverless-upsert-update');
                return [4 /*yield*/, pinecone.createIndex({
                        name: serverlessIndexName,
                        dimension: 2,
                        metric: 'cosine',
                        spec: {
                            serverless: {
                                region: 'us-west-2',
                                cloud: 'aws',
                            },
                        },
                        waitUntilReady: true,
                        suppressConflicts: true,
                    })];
            case 1:
                _a.sent();
                serverlessIndex = pinecone
                    .index(serverlessIndexName)
                    .namespace(test_helpers_1.globalNamespaceOne);
                return [2 /*return*/];
        }
    });
}); });
afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, test_helpers_1.waitUntilReady)(serverlessIndexName)];
            case 1:
                _a.sent();
                return [4 /*yield*/, pinecone.deleteIndex(serverlessIndexName)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// todo: add sparse values update
describe('upsert and update to serverless index', function () {
    test('verify upsert and update', function () { return __awaiter(void 0, void 0, void 0, function () {
        var recordToUpsert, newValues, newMetadata, updateSpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    recordToUpsert = (0, test_helpers_1.generateRecords)({
                        dimension: 2,
                        quantity: 1,
                        withSparseValues: false,
                        withMetadata: true,
                    });
                    // Upsert record
                    return [4 /*yield*/, serverlessIndex.upsert(recordToUpsert)];
                case 1:
                    // Upsert record
                    _a.sent();
                    newValues = [0.5, 0.4];
                    newMetadata = { flavor: 'chocolate' };
                    updateSpy = jest
                        .spyOn(serverlessIndex, 'update')
                        .mockResolvedValue(undefined);
                    // Update values w/new values
                    return [4 /*yield*/, serverlessIndex.update({
                            id: '0',
                            values: newValues,
                            metadata: newMetadata,
                        })];
                case 2:
                    // Update values w/new values
                    _a.sent();
                    expect(updateSpy).toHaveBeenCalledWith({
                        id: '0',
                        values: newValues,
                        metadata: newMetadata,
                    });
                    // Clean up spy after the test
                    updateSpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
});
// Retry logic tests
describe('Testing retry logic via a mock, in-memory http server', function () {
    var recordsToUpsert = (0, test_helpers_1.generateRecords)({
        dimension: 2,
        quantity: 1,
        withSparseValues: false,
        withMetadata: true,
    });
    var server; // Note: server cannot be something like an express server due to conflicts w/edge runtime
    var mockServerlessIndex;
    var callCount;
    var op;
    // Helper function to start the server with a specific response pattern
    var startMockServer = function (shouldSucceedOnSecondCall) {
        // Create http server
        server = http_1.default.createServer(function (req, res) {
            var pathname = (0, url_1.parse)(req.url || '', true).pathname;
            if (req.method === 'POST' && pathname === "/vectors/".concat(op)) {
                callCount++;
                if (shouldSucceedOnSecondCall && callCount === 1) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ name: 'PineconeUnavailableError', status: 503 }));
                }
                else if (shouldSucceedOnSecondCall && callCount === 2) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 200, data: 'Success' }));
                }
                else {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ name: 'PineconeUnavailableError', status: 503 }));
                }
            }
            else {
                res.writeHead(404); // Not found
                res.end();
            }
        });
        server.listen(4000); // Host server on local port 4000
    };
    beforeEach(function () {
        callCount = 0;
    });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Close server and reset mocks
                return [4 /*yield*/, new Promise(function (resolve) { return server.close(function () { return resolve(); }); })];
                case 1:
                    // Close server and reset mocks
                    _a.sent();
                    jest.clearAllMocks();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Upsert operation should retry 1x if server responds 1x with error and 1x with success', function () { return __awaiter(void 0, void 0, void 0, function () {
        var retrySpy, delaySpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    op = 'upsert';
                    pinecone = new index_1.Pinecone({
                        apiKey: process.env['PINECONE_API_KEY'] || '',
                        maxRetries: 2,
                    });
                    mockServerlessIndex = pinecone
                        .Index(serverlessIndexName, 'http://localhost:4000')
                        .namespace(test_helpers_1.globalNamespaceOne);
                    retrySpy = jest.spyOn(utils_1.RetryOnServerFailure.prototype, 'execute');
                    delaySpy = jest.spyOn(utils_1.RetryOnServerFailure.prototype, 'delay');
                    // Start server with a successful response on the second call
                    startMockServer(true);
                    // Call Upsert operation
                    return [4 /*yield*/, mockServerlessIndex.upsert(recordsToUpsert)];
                case 1:
                    // Call Upsert operation
                    _a.sent();
                    // 2 total tries: 1 initial call, 1 retry
                    expect(retrySpy).toHaveBeenCalledTimes(1); // passes
                    expect(delaySpy).toHaveBeenCalledTimes(1); // fails
                    expect(callCount).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('Update operation should retry 1x if server responds 1x with error and 1x with success', function () { return __awaiter(void 0, void 0, void 0, function () {
        var retrySpy, delaySpy, recordIdToUpdate, newMetadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    op = 'update';
                    pinecone = new index_1.Pinecone({
                        apiKey: process.env['PINECONE_API_KEY'] || '',
                        maxRetries: 2,
                    });
                    mockServerlessIndex = pinecone
                        .Index(serverlessIndexName, 'http://localhost:4000')
                        .namespace(test_helpers_1.globalNamespaceOne);
                    retrySpy = jest.spyOn(utils_1.RetryOnServerFailure.prototype, 'execute');
                    delaySpy = jest.spyOn(utils_1.RetryOnServerFailure.prototype, 'delay');
                    // Start server with a successful response on the second call
                    startMockServer(true);
                    recordIdToUpdate = recordsToUpsert[0].id;
                    newMetadata = { flavor: 'chocolate' };
                    // Call Update operation
                    return [4 /*yield*/, mockServerlessIndex.update({
                            id: recordIdToUpdate,
                            metadata: newMetadata,
                        })];
                case 1:
                    // Call Update operation
                    _a.sent();
                    // 2 total tries: 1 initial call, 1 retry
                    expect(retrySpy).toHaveBeenCalledTimes(1);
                    expect(delaySpy).toHaveBeenCalledTimes(1);
                    expect(callCount).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('Max retries exceeded w/o resolve', function () { return __awaiter(void 0, void 0, void 0, function () {
        var retrySpy, delaySpy, errorResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    op = 'upsert';
                    return [4 /*yield*/, (0, test_helpers_1.sleep)(500)];
                case 1:
                    _a.sent(); // In Node20+, tcp connections changed: https://github.com/pinecone-io/pinecone-ts-client/pull/318#issuecomment-2560180936
                    pinecone = new index_1.Pinecone({
                        apiKey: process.env['PINECONE_API_KEY'] || '',
                        maxRetries: 3,
                    });
                    mockServerlessIndex = pinecone
                        .Index(serverlessIndexName, 'http://localhost:4000')
                        .namespace(test_helpers_1.globalNamespaceOne);
                    retrySpy = jest.spyOn(utils_1.RetryOnServerFailure.prototype, 'execute');
                    delaySpy = jest.spyOn(utils_1.RetryOnServerFailure.prototype, 'delay');
                    // Start server with persistent 503 errors on every call
                    startMockServer(false);
                    errorResult = function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, mockServerlessIndex.upsert(recordsToUpsert)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, expect(errorResult).rejects.toThrowError(errors_1.PineconeMaxRetriesExceededError)];
                case 2:
                    _a.sent();
                    // Out of 3 total tries, 2 are retries (i.e. delays), and 1 is the initial call:
                    expect(retrySpy).toHaveBeenCalledTimes(1);
                    expect(delaySpy).toHaveBeenCalledTimes(2);
                    expect(callCount).toBe(3);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=upsertAndUpdate.test.js.map