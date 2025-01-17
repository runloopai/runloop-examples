import { TextSplitter } from '@llamaindex/core/node-parser';
import NodeParser from 'tree-sitter';
import WebParser from 'web-tree-sitter';

type Parser = NodeParser | WebParser;
type CodeSplitterParam = {
    getParser: () => Parser;
    maxChars?: number;
};
declare const DEFAULT_MAX_CHARS = 1500;
declare class CodeSplitter extends TextSplitter {
    #private;
    maxChars: number;
    constructor(params: CodeSplitterParam);
    splitText(text: string): string[];
}

export { CodeSplitter, type CodeSplitterParam, DEFAULT_MAX_CHARS };
