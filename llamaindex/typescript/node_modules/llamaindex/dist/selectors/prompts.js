import { PromptTemplate } from "@llamaindex/core/prompts";
export const defaultSingleSelectPrompt = new PromptTemplate({
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
export const defaultMultiSelectPrompt = new PromptTemplate({
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
