import { getEncoding } from 'js-tiktoken';

var Tokenizers = /*#__PURE__*/ function(Tokenizers) {
    Tokenizers["CL100K_BASE"] = "cl100k_base";
    return Tokenizers;
}({});

// Note: js-tiktoken it's 60x slower than gpt-tokenizer
class TokenizerSingleton {
    constructor(){
        const encoding = getEncoding("cl100k_base");
        this.defaultTokenizer = {
            encode: (text)=>{
                return new Uint32Array(encoding.encode(text));
            },
            decode: (tokens)=>{
                const numberArray = Array.from(tokens);
                const text = encoding.decode(numberArray);
                const uint8Array = new TextEncoder().encode(text);
                return new TextDecoder().decode(uint8Array);
            }
        };
    }
    tokenizer(encoding) {
        if (encoding && encoding !== Tokenizers.CL100K_BASE) {
            throw new Error(`Tokenizer encoding ${encoding} not yet supported`);
        }
        return this.defaultTokenizer;
    }
}
const tokenizers = new TokenizerSingleton();

export { Tokenizers, tokenizers };
