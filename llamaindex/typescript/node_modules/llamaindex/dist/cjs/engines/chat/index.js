"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CondenseQuestionChatEngine", {
    enumerable: true,
    get: function() {
        return _CondenseQuestionChatEngine.CondenseQuestionChatEngine;
    }
});
_export_star(require("@llamaindex/core/chat-engine"), exports);
const _CondenseQuestionChatEngine = require("./CondenseQuestionChatEngine.js");
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
