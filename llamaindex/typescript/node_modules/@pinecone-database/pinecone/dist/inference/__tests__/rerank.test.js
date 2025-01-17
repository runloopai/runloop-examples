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
var inference_1 = require("../inference");
var inferenceOperationsBuilder_1 = require("../inferenceOperationsBuilder");
var errors_1 = require("../../errors");
var inference;
var rerankModel = 'test-model';
var myQuery = 'test-query';
beforeAll(function () {
    var config = { apiKey: 'test-api-key' };
    var infApi = (0, inferenceOperationsBuilder_1.inferenceOperationsBuilder)(config);
    inference = new inference_1.Inference(infApi);
});
test('Confirm throws error if no documents are passed', function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, inference.rerank(rerankModel, myQuery, [])];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                expect(error_1).toEqual(new errors_1.PineconeArgumentError('You must pass at least one document to rerank'));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test('Confirm docs as list of strings is converted to list of objects with `text` key', function () { return __awaiter(void 0, void 0, void 0, function () {
    var myDocuments, expectedDocuments, rerank, expectedReq;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                myDocuments = ['doc1', 'doc2'];
                expectedDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
                rerank = jest.spyOn(inference._inferenceApi, 'rerank');
                rerank.mockResolvedValue({
                    model: 'some-model',
                    data: [{}],
                    usage: { rerankUnits: 1 },
                });
                return [4 /*yield*/, inference.rerank(rerankModel, myQuery, myDocuments)];
            case 1:
                _a.sent();
                expectedReq = {
                    model: rerankModel,
                    query: myQuery,
                    documents: expectedDocuments,
                    parameters: {},
                    rankFields: ['text'],
                    returnDocuments: true,
                    topN: 2,
                };
                expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
                return [2 /*return*/];
        }
    });
}); });
test('Confirm provided rankFields override default `text` field for reranking', function () { return __awaiter(void 0, void 0, void 0, function () {
    var myDocuments, rankFields, rerank, expectedReq;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                myDocuments = [
                    { text: 'doc1', title: 'title1' },
                    { text: 'doc2', title: 'title2' },
                ];
                rankFields = ['title'];
                rerank = jest.spyOn(inference._inferenceApi, 'rerank');
                // @ts-ignore
                rerank.mockResolvedValue({ rerankResponse: {} });
                return [4 /*yield*/, inference.rerank(rerankModel, myQuery, myDocuments, {
                        rankFields: rankFields,
                    })];
            case 1:
                _a.sent();
                expectedReq = {
                    model: rerankModel,
                    query: myQuery,
                    documents: myDocuments,
                    rankFields: rankFields,
                    parameters: {},
                    returnDocuments: true,
                    topN: 2,
                };
                expect(rerank).toHaveBeenCalledWith({ rerankRequest: expectedReq });
                return [2 /*return*/];
        }
    });
}); });
test('Confirm error thrown if query is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
    var myQuery, myDocuments, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                myQuery = '';
                myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, inference.rerank(rerankModel, myQuery, myDocuments)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                expect(error_2).toEqual(new errors_1.PineconeArgumentError('You must pass a query to rerank'));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Confirm error thrown if model is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
    var rerankModel, myDocuments, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                rerankModel = '';
                myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, inference.rerank(rerankModel, myQuery, myDocuments)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                expect(error_3).toEqual(new errors_1.PineconeArgumentError('You must pass the name of a supported reranking model in order to rerank' +
                    ' documents. See https://docs.pinecone.io/models for supported models.'));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=rerank.test.js.map