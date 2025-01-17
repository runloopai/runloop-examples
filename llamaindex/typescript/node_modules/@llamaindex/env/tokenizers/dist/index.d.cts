declare enum Tokenizers {
    CL100K_BASE = "cl100k_base"
}
interface Tokenizer {
    encode: (text: string) => Uint32Array;
    decode: (tokens: Uint32Array) => string;
}

declare class TokenizerSingleton {
    #private;
    constructor();
    tokenizer(encoding?: Tokenizers): Tokenizer;
}
declare const tokenizers: TokenizerSingleton;

export { type Tokenizer, Tokenizers, tokenizers };
