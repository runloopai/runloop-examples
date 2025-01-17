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
var index_1 = require("../../../index");
var test_helpers_1 = require("../../test-helpers");
// todo: deleting non-existent records
// todo: delete all records in namespace
// todo: delete namespace
// todo: delete index (?)
var pinecone, serverlessIndexName, serverlessIndex, recordIds;
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    var recordsToUpsert;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pinecone = new index_1.Pinecone();
                serverlessIndexName = (0, test_helpers_1.randomIndexName)('integration-test-serverless-delete');
                return [4 /*yield*/, pinecone.createIndex({
                        name: serverlessIndexName,
                        dimension: 5,
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
                recordsToUpsert = (0, test_helpers_1.generateRecords)({ dimension: 5, quantity: 5 });
                recordIds = recordsToUpsert.map(function (r) { return r.id; });
                return [4 /*yield*/, serverlessIndex.upsert(recordsToUpsert)];
            case 2:
                _a.sent();
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
describe('delete', function () {
    test('verify delete with an id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var deleteSpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Await record freshness, and check record upserted
                return [4 /*yield*/, (0, test_helpers_1.waitUntilRecordsReady)(serverlessIndex, test_helpers_1.globalNamespaceOne, recordIds)];
                case 1:
                    // Await record freshness, and check record upserted
                    _a.sent();
                    deleteSpy = jest
                        .spyOn(serverlessIndex, 'deleteOne')
                        .mockResolvedValue(undefined);
                    return [4 /*yield*/, serverlessIndex.deleteOne(recordIds[0])];
                case 2:
                    _a.sent();
                    expect(deleteSpy).toHaveBeenCalledWith(recordIds[0]);
                    expect(deleteSpy).toHaveBeenCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('verify deleteMany with multiple ids', function () { return __awaiter(void 0, void 0, void 0, function () {
        var deleteManySpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deleteManySpy = jest
                        .spyOn(serverlessIndex, 'deleteMany')
                        .mockResolvedValue(undefined);
                    return [4 /*yield*/, serverlessIndex.deleteMany(recordIds.slice(1, 3))];
                case 1:
                    _a.sent();
                    expect(deleteManySpy).toHaveBeenCalledWith(recordIds.slice(1, 3));
                    expect(deleteManySpy).toHaveBeenCalledTimes(1);
                    deleteManySpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=delete.test.js.map