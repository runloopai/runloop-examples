import { NodeParser } from '@llamaindex/core/node-parser';
import { TextNode } from '@llamaindex/core/schema';
import { HtmlToTextOptions } from 'html-to-text';

type HTMLNodeParserParam = {
    htmlToTextOptions?: HtmlToTextOptions;
};
declare class HTMLNodeParser extends NodeParser {
    readonly htmlToTextOptions: HtmlToTextOptions | undefined;
    constructor(params?: HTMLNodeParserParam);
    protected parseNodes(documents: TextNode[]): TextNode[];
}

export { HTMLNodeParser, type HTMLNodeParserParam };
