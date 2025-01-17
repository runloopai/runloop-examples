Object.defineProperty(exports, '__esModule', { value: true });

var index_cjs = require('../../schema/dist/index.cjs');
var index_cjs$1 = require('../../utils/dist/index.cjs');
var tokenizers = require('@llamaindex/env/tokenizers');

function truncateMaxTokens(tokenizer, value, maxTokens) {
    // the maximum number of tokens per one character is 2 (e.g. 爨)
    if (value.length * 2 < maxTokens) return value;
    const t = tokenizers.tokenizers.tokenizer(tokenizer);
    let tokens = t.encode(value);
    if (tokens.length > maxTokens) {
        // truncate tokens
        tokens = tokens.slice(0, maxTokens);
        value = t.decode(tokens);
        // if we truncate at an UTF-8 boundary (some characters have more than one token), tiktoken returns a � character - remove it
        return value.replace("�", "");
    }
    return value;
}

const DEFAULT_SIMILARITY_TOP_K = 2;
/**
 * Similarity type
 * Default is cosine similarity. Dot product and negative Euclidean distance are also supported.
 */ var SimilarityType = /*#__PURE__*/ function(SimilarityType) {
    SimilarityType["DEFAULT"] = "cosine";
    SimilarityType["DOT_PRODUCT"] = "dot_product";
    SimilarityType["EUCLIDEAN"] = "euclidean";
    return SimilarityType;
}({});
/**
 * The similarity between two embeddings.
 * @param embedding1
 * @param embedding2
 * @param mode
 * @returns similarity score with higher numbers meaning the two embeddings are more similar
 */ function similarity(embedding1, embedding2, mode = "cosine") {
    if (embedding1.length !== embedding2.length) {
        throw new Error("Embedding length mismatch");
    }
    // NOTE I've taken enough Kahan to know that we should probably leave the
    // numeric programming to numeric programmers. The naive approach here
    // will probably cause some avoidable loss of floating point precision
    // ml-distance is worth watching although they currently also use the naive
    // formulas
    function norm(x) {
        let result = 0;
        for(let i = 0; i < x.length; i++){
            result += x[i] * x[i];
        }
        return Math.sqrt(result);
    }
    switch(mode){
        case "euclidean":
            {
                const difference = embedding1.map((x, i)=>x - embedding2[i]);
                return -norm(difference);
            }
        case "dot_product":
            {
                let result = 0;
                for(let i = 0; i < embedding1.length; i++){
                    result += embedding1[i] * embedding2[i];
                }
                return result;
            }
        case "cosine":
            {
                return similarity(embedding1, embedding2, "dot_product") / (norm(embedding1) * norm(embedding2));
            }
        default:
            throw new Error("Not implemented yet");
    }
}
/**
 * Get the top K embeddings from a list of embeddings ordered by similarity to the query.
 * @param queryEmbedding
 * @param embeddings list of embeddings to consider
 * @param similarityTopK max number of embeddings to return, default 2
 * @param embeddingIds ids of embeddings in the embeddings list
 * @param similarityCutoff minimum similarity score
 * @returns
 */ function getTopKEmbeddings(queryEmbedding, embeddings, similarityTopK = 2, // eslint-disable-next-line @typescript-eslint/no-explicit-any
embeddingIds = null, similarityCutoff = null) {
    if (embeddingIds == null) {
        embeddingIds = Array(embeddings.length).map((_, i)=>i);
    }
    if (embeddingIds.length !== embeddings.length) {
        throw new Error("getTopKEmbeddings: embeddings and embeddingIds length mismatch");
    }
    const similarities = [];
    for(let i = 0; i < embeddings.length; i++){
        const sim = similarity(queryEmbedding, embeddings[i]);
        if (similarityCutoff == null || sim > similarityCutoff) {
            similarities.push({
                similarity: sim,
                id: embeddingIds[i]
            });
        }
    }
    similarities.sort((a, b)=>b.similarity - a.similarity); // Reverse sort
    const resultSimilarities = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultIds = [];
    for(let i = 0; i < similarityTopK; i++){
        if (i >= similarities.length) {
            break;
        }
        resultSimilarities.push(similarities[i].similarity);
        resultIds.push(similarities[i].id);
    }
    return [
        resultSimilarities,
        resultIds
    ];
}
function getTopKMMREmbeddings(queryEmbedding, embeddings, similarityFn = null, similarityTopK = null, // eslint-disable-next-line @typescript-eslint/no-explicit-any
embeddingIds = null, _similarityCutoff = null, mmrThreshold = null) {
    const threshold = mmrThreshold || 0.5;
    similarityFn = similarityFn || similarity;
    if (embeddingIds === null || embeddingIds.length === 0) {
        embeddingIds = Array.from({
            length: embeddings.length
        }, (_, i)=>i);
    }
    const fullEmbedMap = new Map(embeddingIds.map((value, i)=>[
            value,
            i
        ]));
    const embedMap = new Map(fullEmbedMap);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const embedSimilarity = new Map();
    let score = Number.NEGATIVE_INFINITY;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let highScoreId = null;
    for(let i = 0; i < embeddings.length; i++){
        const emb = embeddings[i];
        const similarity = similarityFn(queryEmbedding, emb);
        embedSimilarity.set(embeddingIds[i], similarity);
        if (similarity * threshold > score) {
            highScoreId = embeddingIds[i];
            score = similarity * threshold;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = [];
    const embeddingLength = embeddings.length;
    const similarityTopKCount = similarityTopK || embeddingLength;
    while(results.length < Math.min(similarityTopKCount, embeddingLength)){
        results.push([
            score,
            highScoreId
        ]);
        embedMap.delete(highScoreId);
        const recentEmbeddingId = highScoreId;
        score = Number.NEGATIVE_INFINITY;
        for (const embedId of Array.from(embedMap.keys())){
            const overlapWithRecent = similarityFn(embeddings[embedMap.get(embedId)], embeddings[fullEmbedMap.get(recentEmbeddingId)]);
            if (threshold * embedSimilarity.get(embedId) - (1 - threshold) * overlapWithRecent > score) {
                score = threshold * embedSimilarity.get(embedId) - (1 - threshold) * overlapWithRecent;
                highScoreId = embedId;
            }
        }
    }
    const resultSimilarities = results.map(([s, _])=>s);
    const resultIds = results.map(([_, n])=>n);
    return [
        resultSimilarities,
        resultIds
    ];
}

const DEFAULT_EMBED_BATCH_SIZE = 10;
class BaseEmbedding extends index_cjs.TransformComponent {
    constructor(transformFn){
        if (transformFn) {
            super(transformFn), this.embedBatchSize = DEFAULT_EMBED_BATCH_SIZE, /**
   * Optionally override this method to retrieve multiple embeddings in a single request
   * @param texts
   */ this.getTextEmbeddings = async (texts)=>{
                const embeddings = [];
                for (const text of texts){
                    const embedding = await this.getTextEmbedding(text);
                    embeddings.push(embedding);
                }
                return embeddings;
            };
        } else {
            super(async (nodes, options)=>{
                const texts = nodes.map((node)=>node.getContent(index_cjs.MetadataMode.EMBED));
                const embeddings = await this.getTextEmbeddingsBatch(texts, options);
                for(let i = 0; i < nodes.length; i++){
                    nodes[i].embedding = embeddings[i];
                }
                return nodes;
            }), this.embedBatchSize = DEFAULT_EMBED_BATCH_SIZE, this.getTextEmbeddings = async (texts)=>{
                const embeddings = [];
                for (const text of texts){
                    const embedding = await this.getTextEmbedding(text);
                    embeddings.push(embedding);
                }
                return embeddings;
            };
        }
    }
    similarity(embedding1, embedding2, mode = SimilarityType.DEFAULT) {
        return similarity(embedding1, embedding2, mode);
    }
    async getQueryEmbedding(query) {
        const text = index_cjs$1.extractSingleText(query);
        if (text) {
            return await this.getTextEmbedding(text);
        }
        return null;
    }
    /**
   * Get embeddings for a batch of texts
   * @param texts
   * @param options
   */ async getTextEmbeddingsBatch(texts, options) {
        return await batchEmbeddings(texts, this.getTextEmbeddings, this.embedBatchSize, options);
    }
    truncateMaxTokens(input) {
        return input.map((s)=>{
            // truncate to max tokens
            if (!(this.embedInfo?.tokenizer && this.embedInfo?.maxTokens)) return s;
            return truncateMaxTokens(this.embedInfo.tokenizer, s, this.embedInfo.maxTokens);
        });
    }
}
async function batchEmbeddings(values, embedFunc, chunkSize, options) {
    const resultEmbeddings = [];
    const queue = values;
    const curBatch = [];
    for(let i = 0; i < queue.length; i++){
        curBatch.push(queue[i]);
        if (i == queue.length - 1 || curBatch.length == chunkSize) {
            const embeddings = await embedFunc(curBatch);
            resultEmbeddings.push(...embeddings);
            if (options?.logProgress) {
                console.log(`getting embedding progress: ${i} / ${queue.length}`);
            }
            curBatch.length = 0;
        }
    }
    return resultEmbeddings;
}

/*
 * Base class for Multi Modal embeddings.
 */ class MultiModalEmbedding extends BaseEmbedding {
    constructor(){
        super(async (nodes, options)=>{
            const nodeMap = index_cjs.splitNodesByType(nodes);
            const imageNodes = nodeMap[index_cjs.ModalityType.IMAGE] ?? [];
            const textNodes = nodeMap[index_cjs.ModalityType.TEXT] ?? [];
            const embeddings = await batchEmbeddings(textNodes.map((node)=>node.getContent(index_cjs.MetadataMode.EMBED)), this.getTextEmbeddings.bind(this), this.embedBatchSize, options);
            for(let i = 0; i < textNodes.length; i++){
                textNodes[i].embedding = embeddings[i];
            }
            const imageEmbeddings = await batchEmbeddings(imageNodes.map((n)=>n.image), this.getImageEmbeddings.bind(this), this.embedBatchSize, options);
            for(let i = 0; i < imageNodes.length; i++){
                imageNodes[i].embedding = imageEmbeddings[i];
            }
            return nodes;
        });
    }
    /**
   * Optionally override this method to retrieve multiple image embeddings in a single request
   * @param images
   */ async getImageEmbeddings(images) {
        return Promise.all(images.map((imgFilePath)=>this.getImageEmbedding(imgFilePath)));
    }
    async getQueryEmbedding(query) {
        const image = index_cjs$1.extractImage(query);
        if (image) {
            return await this.getImageEmbedding(image);
        }
        const text = index_cjs$1.extractSingleText(query);
        if (text) {
            return await this.getTextEmbedding(text);
        }
        return null;
    }
}

exports.BaseEmbedding = BaseEmbedding;
exports.DEFAULT_SIMILARITY_TOP_K = DEFAULT_SIMILARITY_TOP_K;
exports.MultiModalEmbedding = MultiModalEmbedding;
exports.SimilarityType = SimilarityType;
exports.batchEmbeddings = batchEmbeddings;
exports.getTopKEmbeddings = getTopKEmbeddings;
exports.getTopKMMREmbeddings = getTopKMMREmbeddings;
exports.similarity = similarity;
exports.truncateMaxTokens = truncateMaxTokens;
