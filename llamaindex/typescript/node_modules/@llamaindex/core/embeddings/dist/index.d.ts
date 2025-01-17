import { Tokenizers } from '@llamaindex/env/tokenizers';
import { MessageContentDetail } from '../../llms/dist/index.js';
import { TransformComponent, BaseNode, ImageType } from '../../schema/dist/index.js';

declare const DEFAULT_SIMILARITY_TOP_K = 2;
/**
 * Similarity type
 * Default is cosine similarity. Dot product and negative Euclidean distance are also supported.
 */
declare enum SimilarityType {
    DEFAULT = "cosine",
    DOT_PRODUCT = "dot_product",
    EUCLIDEAN = "euclidean"
}
/**
 * The similarity between two embeddings.
 * @param embedding1
 * @param embedding2
 * @param mode
 * @returns similarity score with higher numbers meaning the two embeddings are more similar
 */
declare function similarity(embedding1: number[], embedding2: number[], mode?: SimilarityType): number;
/**
 * Get the top K embeddings from a list of embeddings ordered by similarity to the query.
 * @param queryEmbedding
 * @param embeddings list of embeddings to consider
 * @param similarityTopK max number of embeddings to return, default 2
 * @param embeddingIds ids of embeddings in the embeddings list
 * @param similarityCutoff minimum similarity score
 * @returns
 */
declare function getTopKEmbeddings(queryEmbedding: number[], embeddings: number[][], similarityTopK?: number, embeddingIds?: any[] | null, similarityCutoff?: number | null): [number[], any[]];
declare function getTopKMMREmbeddings(queryEmbedding: number[], embeddings: number[][], similarityFn?: ((...args: any[]) => number) | null, similarityTopK?: number | null, embeddingIds?: any[] | null, _similarityCutoff?: number | null, mmrThreshold?: number | null): [number[], any[]];

type EmbedFunc<T> = (values: T[]) => Promise<Array<number[]>>;
type EmbeddingInfo = {
    dimensions?: number;
    maxTokens?: number;
    tokenizer?: Tokenizers;
};
type BaseEmbeddingOptions = {
    logProgress?: boolean;
};
declare abstract class BaseEmbedding extends TransformComponent<Promise<BaseNode[]>> {
    embedBatchSize: number;
    embedInfo?: EmbeddingInfo;
    protected constructor(transformFn?: (nodes: BaseNode[], options?: BaseEmbeddingOptions) => Promise<BaseNode[]>);
    similarity(embedding1: number[], embedding2: number[], mode?: SimilarityType): number;
    abstract getTextEmbedding(text: string): Promise<number[]>;
    getQueryEmbedding(query: MessageContentDetail): Promise<number[] | null>;
    /**
     * Optionally override this method to retrieve multiple embeddings in a single request
     * @param texts
     */
    getTextEmbeddings: (texts: string[]) => Promise<Array<number[]>>;
    /**
     * Get embeddings for a batch of texts
     * @param texts
     * @param options
     */
    getTextEmbeddingsBatch(texts: string[], options?: BaseEmbeddingOptions): Promise<Array<number[]>>;
    truncateMaxTokens(input: string[]): string[];
}
declare function batchEmbeddings<T>(values: T[], embedFunc: EmbedFunc<T>, chunkSize: number, options?: BaseEmbeddingOptions): Promise<Array<number[]>>;

declare abstract class MultiModalEmbedding extends BaseEmbedding {
    abstract getImageEmbedding(images: ImageType): Promise<number[]>;
    protected constructor();
    /**
     * Optionally override this method to retrieve multiple image embeddings in a single request
     * @param images
     */
    getImageEmbeddings(images: ImageType[]): Promise<number[][]>;
    getQueryEmbedding(query: MessageContentDetail): Promise<number[] | null>;
}

declare function truncateMaxTokens(tokenizer: Tokenizers, value: string, maxTokens: number): string;

export { BaseEmbedding, type BaseEmbeddingOptions, DEFAULT_SIMILARITY_TOP_K, type EmbeddingInfo, MultiModalEmbedding, SimilarityType, batchEmbeddings, getTopKEmbeddings, getTopKMMREmbeddings, similarity, truncateMaxTokens };
