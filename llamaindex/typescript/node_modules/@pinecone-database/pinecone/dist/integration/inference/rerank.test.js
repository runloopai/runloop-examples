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
var pinecone_1 = require("../../pinecone");
describe('Integration Test: Pinecone Inference API rerank endpoint', function () {
    var model;
    var query;
    var documents;
    var pinecone;
    beforeAll(function () {
        model = 'bge-reranker-v2-m3';
        query = 'What are some good Turkey dishes for Thanksgiving?';
        documents = [
            'document content 1 yay I am about turkey',
            'document content 2',
        ];
        var apiKey = process.env.PINECONE_API_KEY || '';
        pinecone = new pinecone_1.Pinecone({ apiKey: apiKey });
    });
    test('Confirm high-level response structure', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pinecone.inference.rerank(model, query, documents)];
                case 1:
                    response = _a.sent();
                    expect(response.model).toEqual(model);
                    expect(response.data).toBeDefined();
                    expect(response.usage).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm lower-level response structure', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pinecone.inference.rerank(model, query, documents)];
                case 1:
                    response = _a.sent();
                    expect(response.data.length).toBe(documents.length);
                    expect(response.data.map(function (doc) { return doc.index; })).toBeDefined();
                    expect(response.data.map(function (doc) { return doc.score; })).toBeDefined();
                    expect(response.data.map(function (doc) { return doc.document; })).toBeDefined();
                    // @ts-ignore
                    // (Just ignoring the fact that technically doc.document['text'] could be undefined)
                    expect(response.data.map(function (doc) { return doc.document['text']; })).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm list of strings as docs + rankFields set to customField fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments, rankFields;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = ['doc1', 'doc2'];
                    rankFields = ['customField'];
                    return [4 /*yield*/, expect(pinecone.inference.rerank(model, query, myDocuments, { rankFields: rankFields })).rejects.toThrow(expect.objectContaining({
                            message: expect.stringContaining("field 'customField' not found in document at index 0"),
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm docs as list of objects + no rankFields succeeds, if docs contain `text` key, succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = [{ text: 'doc1' }, { text: 'doc2' }];
                    return [4 /*yield*/, pinecone.inference.rerank(model, query, myDocuments)];
                case 1:
                    resp = _a.sent();
                    expect(resp.usage.rerankUnits).toBeGreaterThanOrEqual(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm docs as list of objects with additional customField + no rankfields, succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = [
                        { text: 'hi', customField: 'doc1' },
                        { text: 'bye', customField: 'doc2' },
                    ];
                    return [4 /*yield*/, pinecone.inference.rerank(model, query, myDocuments)];
                case 1:
                    resp = _a.sent();
                    expect(resp.usage.rerankUnits).toBeGreaterThanOrEqual(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm docs as list of objects with only custom fields + custom rankFields, succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments, rankFields, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = [
                        { customField2: 'hi', customField: 'doc1' },
                        { customField2: 'bye', customField: 'doc2' },
                    ];
                    rankFields = ['customField2'];
                    return [4 /*yield*/, pinecone.inference.rerank(model, query, myDocuments, {
                            rankFields: rankFields,
                        })];
                case 1:
                    resp = _a.sent();
                    expect(resp.usage.rerankUnits).toBeGreaterThanOrEqual(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm error thrown if docs as list of objects only has custom fields + no custom rankFields obj is passed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = [
                        { customField2: 'hi', customField: 'doc1' },
                        { customField2: 'bye', customField: 'doc2' },
                    ];
                    return [4 /*yield*/, expect(pinecone.inference.rerank(model, query, myDocuments)).rejects.toThrow(expect.objectContaining({
                            message: expect.stringContaining('Documents must be a list of strings or objects containing the "text" field'),
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm error thrown if rankFields does not match fields in passed documents', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments, rankFields;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = [
                        { text: 'doc1', title: 'title1' },
                        { text: 'doc2', title: 'title2' },
                    ];
                    rankFields = ['NonExistentRankField'];
                    return [4 /*yield*/, expect(pinecone.inference.rerank(model, query, myDocuments, {
                            rankFields: rankFields,
                        })).rejects.toThrow(expect.objectContaining({
                            message: expect.stringContaining("field 'NonExistentRankField' not found in document at index"),
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Confirm error thrown if rankFields > 1 for model that only allows 1', function () { return __awaiter(void 0, void 0, void 0, function () {
        var myDocuments, rankFields;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    myDocuments = [
                        { text: 'doc1', title: 'title1' },
                        { text: 'doc2', title: 'title2' },
                    ];
                    rankFields = ['title', 'text'];
                    return [4 /*yield*/, expect(pinecone.inference.rerank(model, query, myDocuments, {
                            rankFields: rankFields,
                        })).rejects.toThrow(expect.objectContaining({
                            message: expect.stringContaining('"Only one rank field is supported for model'),
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=rerank.test.js.map