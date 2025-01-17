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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var test_helpers_1 = require("./test-helpers");
// todo: refactor to make conditions & loops more efficient
var setup = function () { return __awaiter(void 0, void 0, void 0, function () {
    var apiKey, pc, randomIndexName, indexes, recordsToUpsert, oneRecordWithDiffPrefix, allRecords, recordsToUpsert, oneRecordWithDiffPrefix, allRecords;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (process.env['PINECONE_API_KEY'] === undefined) {
                    throw new Error('PINECONE_API_KEY environment variable not set');
                }
                else {
                    apiKey = process.env['PINECONE_API_KEY'];
                }
                pc = new index_1.Pinecone({ apiKey: apiKey });
                randomIndexName = "serverless-integration-".concat(Math.random()
                    .toString(36)
                    .slice(2, 8));
                return [4 /*yield*/, pc.listIndexes()];
            case 1:
                indexes = _a.sent();
                if (!indexes.indexes) return [3 /*break*/, 8];
                if (!indexes.indexes.some(function (index) { return index.name === randomIndexName; })) return [3 /*break*/, 4];
                recordsToUpsert = (0, test_helpers_1.generateRecords)({
                    prefix: test_helpers_1.prefix,
                    dimension: 2,
                    quantity: 10,
                    withSparseValues: true,
                    withMetadata: true,
                });
                oneRecordWithDiffPrefix = (0, test_helpers_1.generateRecords)({
                    prefix: test_helpers_1.diffPrefix,
                    dimension: 2,
                    quantity: 1,
                    withSparseValues: true,
                    withMetadata: true,
                });
                allRecords = __spreadArray(__spreadArray([], oneRecordWithDiffPrefix, true), recordsToUpsert, true);
                //   upsert records into namespace
                return [4 /*yield*/, pc
                        .index(randomIndexName)
                        .namespace(test_helpers_1.globalNamespaceOne)
                        .upsert(allRecords)];
            case 2:
                //   upsert records into namespace
                _a.sent();
                return [4 /*yield*/, (0, test_helpers_1.sleep)(10000)];
            case 3:
                _a.sent();
                return [3 /*break*/, 8];
            case 4: 
            // Create serverless index for data plane tests
            return [4 /*yield*/, pc.createIndex({
                    name: randomIndexName,
                    dimension: 2,
                    metric: 'dotproduct',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: 'us-west-2',
                        },
                    },
                    waitUntilReady: true,
                    tags: { project: 'pinecone-integration-tests-serverless' },
                })];
            case 5:
                // Create serverless index for data plane tests
                _a.sent();
                recordsToUpsert = (0, test_helpers_1.generateRecords)({
                    prefix: test_helpers_1.prefix,
                    dimension: 2,
                    quantity: 10,
                    withSparseValues: true,
                    withMetadata: true,
                });
                oneRecordWithDiffPrefix = (0, test_helpers_1.generateRecords)({
                    prefix: test_helpers_1.diffPrefix,
                    dimension: 2,
                    quantity: 1,
                    withSparseValues: true,
                    withMetadata: true,
                });
                allRecords = __spreadArray(__spreadArray([], oneRecordWithDiffPrefix, true), recordsToUpsert, true);
                //   upsert records into namespace
                return [4 /*yield*/, pc
                        .index(randomIndexName)
                        .namespace(test_helpers_1.globalNamespaceOne)
                        .upsert(allRecords)];
            case 6:
                //   upsert records into namespace
                _a.sent();
                return [4 /*yield*/, (0, test_helpers_1.sleep)(10000)];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                // Capture output in GITHUB_OUTPUT env var when run in CI; necessary to pass across tests
                console.log("SERVERLESS_INDEX_NAME=".concat(randomIndexName));
                return [2 /*return*/];
        }
    });
}); };
setup();
//# sourceMappingURL=setup.js.map