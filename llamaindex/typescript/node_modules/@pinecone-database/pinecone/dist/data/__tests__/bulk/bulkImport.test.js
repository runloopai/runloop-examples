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
var startImport_1 = require("../../bulk/startImport");
var listImports_1 = require("../../bulk/listImports");
var describeImport_1 = require("../../bulk/describeImport");
var cancelImport_1 = require("../../bulk/cancelImport");
var db_data_1 = require("../../../pinecone-generated-ts-fetch/db_data");
var errors_1 = require("../../../errors");
describe('StartImportCommand', function () {
    var apiProviderMock;
    var apiMock; // Mocking the API returned by `provide`
    var startImportCommand;
    var listImportCommand;
    var describeImportCommand;
    var cancelImportCommand;
    beforeEach(function () {
        apiMock = {
            startBulkImport: jest.fn(),
            listBulkImports: jest.fn(),
            describeBulkImport: jest.fn(),
            cancelBulkImport: jest.fn(),
        };
        apiProviderMock = {
            provide: jest.fn().mockResolvedValue(apiMock),
        };
        startImportCommand = new startImport_1.StartImportCommand(apiProviderMock, '');
        listImportCommand = new listImports_1.ListImportsCommand(apiProviderMock, '');
        describeImportCommand = new describeImport_1.DescribeImportCommand(apiProviderMock, '');
        cancelImportCommand = new cancelImport_1.CancelImportCommand(apiProviderMock, '');
    });
    test('should call startImport with correct request when errorMode is "continue"', function () { return __awaiter(void 0, void 0, void 0, function () {
        var uri, errorMode, expectedRequest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = 's3://my-bucket/my-file.csv';
                    errorMode = 'continue';
                    expectedRequest = {
                        startImportRequest: {
                            uri: uri,
                            errorMode: { onError: db_data_1.ImportErrorModeOnErrorEnum.Continue },
                        },
                    };
                    return [4 /*yield*/, startImportCommand.run(uri, errorMode)];
                case 1:
                    _a.sent();
                    expect(apiProviderMock.provide).toHaveBeenCalled();
                    expect(apiMock.startBulkImport).toHaveBeenCalledWith(expectedRequest);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should call startImport with correct request when errorMode is "abort"', function () { return __awaiter(void 0, void 0, void 0, function () {
        var uri, errorMode, expectedRequest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = 's3://my-bucket/my-file.csv';
                    errorMode = 'abort';
                    expectedRequest = {
                        startImportRequest: {
                            uri: uri,
                            errorMode: { onError: db_data_1.ImportErrorModeOnErrorEnum.Abort },
                        },
                    };
                    return [4 /*yield*/, startImportCommand.run(uri, errorMode)];
                case 1:
                    _a.sent();
                    expect(apiProviderMock.provide).toHaveBeenCalled();
                    expect(apiMock.startBulkImport).toHaveBeenCalledWith(expectedRequest);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw PineconeArgumentError for invalid errorMode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var uri, errorMode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = 's3://my-bucket/my-file.csv';
                    errorMode = 'invalid';
                    return [4 /*yield*/, expect(startImportCommand.run(uri, errorMode)).rejects.toThrow(errors_1.PineconeArgumentError)];
                case 1:
                    _a.sent();
                    expect(apiMock.startBulkImport).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should use "continue" as default when errorMode is undefined', function () { return __awaiter(void 0, void 0, void 0, function () {
        var uri, expectedRequest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = 's3://my-bucket/my-file.csv';
                    expectedRequest = {
                        startImportRequest: {
                            uri: uri,
                            errorMode: { onError: db_data_1.ImportErrorModeOnErrorEnum.Continue },
                        },
                    };
                    return [4 /*yield*/, startImportCommand.run(uri, undefined)];
                case 1:
                    _a.sent();
                    expect(apiProviderMock.provide).toHaveBeenCalled();
                    expect(apiMock.startBulkImport).toHaveBeenCalledWith(expectedRequest);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw error when URI/1st arg is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var toThrow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    toThrow = function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: 
                                // @ts-ignore
                                return [4 /*yield*/, startImportCommand.run()];
                                case 1:
                                    // @ts-ignore
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, expect(toThrow).rejects.toThrowError(errors_1.PineconeArgumentError)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, expect(toThrow).rejects.toThrowError('`uri` field is required and must start with the scheme of a supported storage provider.')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should call listImport with correct request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var limit, expectedRequest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = 1;
                    expectedRequest = {
                        limit: limit,
                    };
                    return [4 /*yield*/, listImportCommand.run(limit)];
                case 1:
                    _a.sent();
                    expect(apiProviderMock.provide).toHaveBeenCalled();
                    expect(apiMock.listBulkImports).toHaveBeenCalledWith(expectedRequest);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should call describeImport with correct request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var importId, req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    importId = 'import-id';
                    req = { id: importId };
                    return [4 /*yield*/, describeImportCommand.run(importId)];
                case 1:
                    _a.sent();
                    expect(apiProviderMock.provide).toHaveBeenCalled();
                    expect(apiMock.describeBulkImport).toHaveBeenCalledWith(req);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should call cancelImport with correct request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var importId, req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    importId = 'import-id';
                    req = { id: importId };
                    return [4 /*yield*/, cancelImportCommand.run(importId)];
                case 1:
                    _a.sent();
                    expect(apiProviderMock.provide).toHaveBeenCalled();
                    expect(apiMock.cancelBulkImport).toHaveBeenCalledWith(req);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=bulkImport.test.js.map