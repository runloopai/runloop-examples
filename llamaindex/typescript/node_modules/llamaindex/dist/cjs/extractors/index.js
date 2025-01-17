"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    BaseExtractor: function() {
        return _types.BaseExtractor;
    },
    KeywordExtractor: function() {
        return _MetadataExtractors.KeywordExtractor;
    },
    QuestionsAnsweredExtractor: function() {
        return _MetadataExtractors.QuestionsAnsweredExtractor;
    },
    SummaryExtractor: function() {
        return _MetadataExtractors.SummaryExtractor;
    },
    TitleExtractor: function() {
        return _MetadataExtractors.TitleExtractor;
    }
});
const _MetadataExtractors = require("./MetadataExtractors.js");
const _types = require("./types.js");
