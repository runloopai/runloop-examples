import { NodeParser } from '@llamaindex/core/node-parser';
import { MetadataMode, buildNodeFromSplits } from '@llamaindex/core/schema';
import { htmlToText } from 'html-to-text';

class HTMLNodeParser extends NodeParser {
    constructor(params){
        super(), this.htmlToTextOptions = undefined;
        if (params?.htmlToTextOptions) {
            this.htmlToTextOptions = params.htmlToTextOptions;
        }
    }
    parseNodes(documents) {
        const nodes = [];
        for (const document of documents){
            const text = htmlToText(document.getContent(MetadataMode.NONE), this.htmlToTextOptions);
            nodes.push(...buildNodeFromSplits([
                text
            ], document));
        }
        return nodes;
    }
}

export { HTMLNodeParser };
