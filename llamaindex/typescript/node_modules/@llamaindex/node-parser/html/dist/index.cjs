Object.defineProperty(exports, '__esModule', { value: true });

var nodeParser = require('@llamaindex/core/node-parser');
var schema = require('@llamaindex/core/schema');
var htmlToText = require('html-to-text');

class HTMLNodeParser extends nodeParser.NodeParser {
    constructor(params){
        super(), this.htmlToTextOptions = undefined;
        if (params?.htmlToTextOptions) {
            this.htmlToTextOptions = params.htmlToTextOptions;
        }
    }
    parseNodes(documents) {
        const nodes = [];
        for (const document of documents){
            const text = htmlToText.htmlToText(document.getContent(schema.MetadataMode.NONE), this.htmlToTextOptions);
            nodes.push(...schema.buildNodeFromSplits([
                text
            ], document));
        }
        return nodes;
    }
}

exports.HTMLNodeParser = HTMLNodeParser;
