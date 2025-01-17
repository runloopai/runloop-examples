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
    defaultMultiSelectPrompt: function() {
        return defaultMultiSelectPrompt;
    },
    defaultSingleSelectPrompt: function() {
        return defaultSingleSelectPrompt;
    }
});
const _prompts = require("@llamaindex/core/prompts");
const defaultSingleSelectPrompt = new _prompts.PromptTemplate({
    templateVars: [
        "context",
        "query",
        "numChoices"
    ],
    template: `Some choices are given below. It is provided in a numbered list (1 to {numChoices}), where each item in the list corresponds to a summary.
---------------------
{context}
---------------------
Using only the choices above and not prior knowledge, return the choice that is most relevant to the question: '{query}'
`
});
const defaultMultiSelectPrompt = new _prompts.PromptTemplate({
    templateVars: [
        "contextList",
        "query",
        "maxOutputs",
        "numChoices"
    ],
    template: `Some choices are given below. It is provided in a numbered list (1 to {numChoices}), where each item in the list corresponds to a summary.
---------------------
{contextList}
---------------------
Using only the choices above and not prior knowledge, return the top choices (no more than {maxOutputs}, but only select what is needed) that are most relevant to the question: '{query}'
`
});
