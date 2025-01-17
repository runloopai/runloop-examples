"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BaseSelector", {
    enumerable: true,
    get: function() {
        return BaseSelector;
    }
});
const _prompts = require("@llamaindex/core/prompts");
function wrapChoice(choice) {
    if (typeof choice === "string") {
        return {
            description: choice
        };
    } else {
        return choice;
    }
}
class BaseSelector extends _prompts.PromptMixin {
    async select(choices, query) {
        const metadata = choices.map((choice)=>wrapChoice(choice));
        return await this._select(metadata, query);
    }
}
