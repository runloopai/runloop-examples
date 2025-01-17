Object.defineProperty(exports, '__esModule', { value: true });

var global = require('@llamaindex/core/global');
var nodeParser = require('@llamaindex/core/node-parser');

const DEFAULT_MAX_CHARS = 1500;
class CodeSplitter extends nodeParser.TextSplitter {
    #parser;
    constructor(params){
        super(), this.maxChars = DEFAULT_MAX_CHARS;
        this.#parser = params.getParser();
        if (params.maxChars) {
            this.maxChars = params.maxChars;
        }
    }
    #chunkNode(node, text, lastEnd = 0) {
        let newChunks = [];
        let currentChunk = "";
        for (const child of node.children){
            if (child.endIndex - child.startIndex > this.maxChars) {
                // Child is too big, recursively chunk the child
                if (currentChunk.length > 0) {
                    newChunks.push(currentChunk.trim());
                    currentChunk = "";
                }
                newChunks = newChunks.concat(this.#chunkNode(child, text, lastEnd));
            } else if (currentChunk.length + (child.endIndex - child.startIndex) > this.maxChars) {
                // Child would make the current chunk too big, so start a new chunk
                newChunks.push(currentChunk.trim());
                currentChunk = text.slice(lastEnd, child.endIndex);
            } else {
                currentChunk += text.slice(lastEnd, child.endIndex);
            }
            lastEnd = child.endIndex;
        }
        if (currentChunk.length > 0) {
            newChunks.push(currentChunk.trim());
        }
        return newChunks;
    }
    splitText(text) {
        const callbackManager = global.Settings.callbackManager;
        callbackManager.dispatchEvent("chunking-start", {
            text: [
                text
            ]
        });
        const tree = this.#parser.parse(text);
        const rootNode = tree.rootNode;
        if (rootNode.children.length === 0 || rootNode.children[0]?.type === "ERROR") {
            throw new Error("Could not parse code with language");
        } else {
            const chunks = this.#chunkNode(rootNode, text);
            callbackManager.dispatchEvent("chunking-end", {
                chunks
            });
            return chunks;
        }
    }
}

exports.CodeSplitter = CodeSplitter;
exports.DEFAULT_MAX_CHARS = DEFAULT_MAX_CHARS;
