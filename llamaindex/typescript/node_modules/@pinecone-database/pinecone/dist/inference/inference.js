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
exports.Inference = void 0;
var models_1 = require("../models");
var errors_1 = require("../errors");
/* This class is the class through which users interact with Pinecone's inference API.  */
var Inference = /** @class */ (function () {
    function Inference(inferenceApi) {
        this._inferenceApi = inferenceApi;
    }
    /* Format the input data into the correct format for the Inference API request. */
    Inference.prototype._formatInputs = function (data) {
        return data.map(function (str) {
            return { text: str };
        });
    };
    /* Generate embeddings for a list of input strings using a specified embedding model. */
    Inference.prototype.embed = function (model, inputs, params) {
        return __awaiter(this, void 0, void 0, function () {
            var typedAndFormattedInputs, typedRequest, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        typedAndFormattedInputs = this._formatInputs(inputs);
                        typedRequest = {
                            embedRequest: {
                                model: model,
                                inputs: typedAndFormattedInputs,
                                parameters: params,
                            },
                        };
                        return [4 /*yield*/, this._inferenceApi.embed(typedRequest)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, new models_1.EmbeddingsList(response.model, response.data, response.usage)];
                }
            });
        });
    };
    /** Rerank documents against a query with a reranking model. Each document is ranked in descending relevance order
     *  against the query provided.
     *
     *  @example
     *  ````typescript
     *  import { Pinecone } from '@pinecone-database/pinecone';
     *  const pc = new Pinecone();
     *  const rerankingModel = 'bge-reranker-v2-m3';
     *  const myQuery = 'What are some good Turkey dishes for Thanksgiving?';
     *
     *  // Option 1: Documents as an array of strings
     *  const myDocsStrings = [
     *    'I love turkey sandwiches with pastrami',
     *    'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
     *    'My favorite Thanksgiving dish is pumpkin pie',
     *    'Turkey is a great source of protein',
     *  ];
     *
     *  // Option 1 response
     *  const response = await pc.inference.rerank(
     *    rerankingModel,
     *    myQuery,
     *    myDocsStrings
     *  );
     *  console.log(response);
     *  // {
     *  // model: 'bge-reranker-v2-m3',
     *  // data: [
     *  //   { index: 1, score: 0.5633179, document: [Object] },
     *  //   { index: 2, score: 0.02013874, document: [Object] },
     *  //   { index: 3, score: 0.00035419367, document: [Object] },
     *  //   { index: 0, score: 0.00021485926, document: [Object] }
     *  // ],
     *  // usage: { rerankUnits: 1 }
     *  // }
     *
     *  // Option 2: Documents as an array of objects
     *  const myDocsObjs = [
     *    {
     *      title: 'Turkey Sandwiches',
     *      body: 'I love turkey sandwiches with pastrami',
     *    },
     *    {
     *      title: 'Lemon Turkey',
     *      body: 'A lemon brined Turkey with apple sausage stuffing is a classic Thanksgiving main',
     *    },
     *    {
     *      title: 'Thanksgiving',
     *      body: 'My favorite Thanksgiving dish is pumpkin pie',
     *    },
     *    { title: 'Protein Sources', body: 'Turkey is a great source of protein' },
     *  ];
     *
     *  // Option 2: Options object declaring which custom key to rerank on
     *  // Note: If no custom key is passed via `rankFields`, each doc must contain a `text` key, and that will act as
     *   the default)
     *  const rerankOptions = {
     *    topN: 3,
     *    returnDocuments: false,
     *    rankFields: ['body'],
     *    parameters: {
     *      inputType: 'passage',
     *      truncate: 'END',
     *    },
     *  };
     *
     *  // Option 2 response
     *  const response = await pc.inference.rerank(
     *    rerankingModel,
     *    myQuery,
     *    myDocsObjs,
     *    rerankOptions
     *  );
     *  console.log(response);
     *  // {
     *  // model: 'bge-reranker-v2-m3',
     *  // data: [
     *  //   { index: 1, score: 0.5633179, document: undefined },
     *  //   { index: 2, score: 0.02013874, document: undefined },
     *  //   { index: 3, score: 0.00035419367, document: undefined },
     *  // ],
     *  // usage: { rerankUnits: 1 }
     *  //}
     * ```
     *
     * @param model - (Required) The model to use for reranking. Currently, the only available model is "[bge-reranker-v2-m3](https://docs.pinecone.io/models/bge-reranker-v2-m3)"}.
     * @param query - (Required) The query to rerank documents against.
     * @param documents - (Required) An array of documents to rerank. The array can either be an array of strings or
     * an array of objects.
     * @param options - (Optional) Additional options to send with the reranking request. See {@link RerankOptions} for more details.
     * */
    Inference.prototype.rerank = function (model, query, documents, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, topN, _b, returnDocuments, _c, parameters, _d, rankFields, newDocuments, req;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (documents.length == 0) {
                            throw new errors_1.PineconeArgumentError('You must pass at least one document to rerank');
                        }
                        if (query.length == 0) {
                            throw new errors_1.PineconeArgumentError('You must pass a query to rerank');
                        }
                        if (model.length == 0) {
                            throw new errors_1.PineconeArgumentError('You must pass the name of a supported reranking model in order to rerank' +
                                ' documents. See https://docs.pinecone.io/models for supported models.');
                        }
                        _a = options.topN, topN = _a === void 0 ? documents.length : _a, _b = options.returnDocuments, returnDocuments = _b === void 0 ? true : _b, _c = options.parameters, parameters = _c === void 0 ? {} : _c;
                        _d = options.rankFields, rankFields = _d === void 0 ? ['text'] : _d;
                        newDocuments = documents.map(function (doc) {
                            return typeof doc === 'string' ? { text: doc } : doc;
                        });
                        if (!options.rankFields) {
                            if (!newDocuments.every(function (doc) { return typeof doc === 'object' && doc.text; })) {
                                throw new errors_1.PineconeArgumentError('Documents must be a list of strings or objects containing the "text" field');
                            }
                        }
                        if (options.rankFields) {
                            rankFields = options.rankFields;
                        }
                        req = {
                            rerankRequest: {
                                model: model,
                                query: query,
                                documents: newDocuments,
                                topN: topN,
                                returnDocuments: returnDocuments,
                                rankFields: rankFields,
                                parameters: parameters,
                            },
                        };
                        return [4 /*yield*/, this._inferenceApi.rerank(req)];
                    case 1: return [2 /*return*/, _e.sent()];
                }
            });
        });
    };
    return Inference;
}());
exports.Inference = Inference;
//# sourceMappingURL=inference.js.map