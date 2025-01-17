"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OpenAIContextAwareAgent", {
    enumerable: true,
    get: function() {
        return OpenAIContextAwareAgent;
    }
});
const _openai = _export_star(require("@llamaindex/openai"), exports);
const _contextAwareMixin = require("./contextAwareMixin.js");
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
const OpenAIContextAwareAgent = (0, _contextAwareMixin.withContextAwareness)(_openai.OpenAIAgent);
