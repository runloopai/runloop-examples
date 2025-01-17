import { PromptMixin } from "@llamaindex/core/prompts";
function wrapChoice(choice) {
    if (typeof choice === "string") {
        return {
            description: choice
        };
    } else {
        return choice;
    }
}
export class BaseSelector extends PromptMixin {
    async select(choices, query) {
        const metadata = choices.map((choice)=>wrapChoice(choice));
        return await this._select(metadata, query);
    }
}
