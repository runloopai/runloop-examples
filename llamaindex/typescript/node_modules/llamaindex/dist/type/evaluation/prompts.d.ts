import { PromptTemplate } from "@llamaindex/core/prompts";
export declare const defaultUserPrompt: PromptTemplate<readonly ["query", "referenceAnswer", "generatedAnswer"], string[], "\n## User Query\n{query}\n\n## Reference Answer\n{referenceAnswer}\n\n## Generated Answer\n{generatedAnswer}\n">;
export type UserPrompt = PromptTemplate<[
    "query",
    "referenceAnswer",
    "generatedAnswer"
]>;
export declare const defaultCorrectnessSystemPrompt: CorrectnessSystemPrompt;
export type CorrectnessSystemPrompt = PromptTemplate<[]>;
export declare const defaultFaithfulnessRefinePrompt: PromptTemplate<readonly ["query", "existingAnswer", "context"], string[], "\nWe want to understand if the following information is present\nin the context information: {query}\nWe have provided an existing YES/NO answer: {existingAnswer}\nWe have the opportunity to refine the existing answer\n(only if needed) with some more context below.\n------------\n{context}\n------------\nIf the existing answer was already YES, still answer YES.\nIf the information is present in the new context, answer YES.\nOtherwise answer NO.\n">;
export type FaithfulnessRefinePrompt = PromptTemplate<[
    "query",
    "existingAnswer",
    "context"
]>;
export declare const defaultFaithfulnessTextQaPrompt: PromptTemplate<readonly ["context", "query"], string[], "\nPlease tell if a given piece of information\nis supported by the context.\nYou need to answer with either YES or NO.\nAnswer YES if any of the context supports the information, even\nif most of the context is unrelated.\nSome examples are provided below.\n\nInformation: Apple pie is generally double-crusted.\nContext: An apple pie is a fruit pie in which the principal filling\ningredient is apples.\nApple pie is often served with whipped cream, ice cream\n('apple pie à la mode'), custard or cheddar cheese.\nIt is generally double-crusted, with pastry both above\nand below the filling; the upper crust may be solid or\nlatticed (woven of crosswise strips).\nAnswer: YES\nInformation: Apple pies tastes bad.\nContext: An apple pie is a fruit pie in which the principal filling\ningredient is apples.\nApple pie is often served with whipped cream, ice cream\n('apple pie à la mode'), custard or cheddar cheese.\nIt is generally double-crusted, with pastry both above\nand below the filling; the upper crust may be solid or\nlatticed (woven of crosswise strips).\nAnswer: NO\nInformation: {query}\nContext: {context}\nAnswer:\n">;
export type FaithfulnessTextQAPrompt = PromptTemplate<["query", "context"]>;
export type RelevancyEvalPrompt = PromptTemplate<["context", "query"]>;
export declare const defaultRelevancyEvalPrompt: PromptTemplate<readonly ["context", "query"], string[], "Your task is to evaluate if the response for the query is in line with the context information provided.\nYou have two options to answer. Either YES/ NO.\nAnswer - YES, if the response for the query is in line with context information otherwise NO.\nQuery and Response: {query}\nContext: {context}\nAnswer: ">;
export declare const defaultRelevancyRefinePrompt: PromptTemplate<readonly ["query", "existingAnswer", "contextMsg"], string[], "We want to understand if the following query and response is\nin line with the context information: \n{query}\nWe have provided an existing YES/NO answer: \n{existingAnswer}\nWe have the opportunity to refine the existing answer\n(only if needed) with some more context below.\n------------\n{contextMsg}\n------------\nIf the existing answer was already YES, still answer YES.\nIf the information is present in the new context, answer YES.\nOtherwise answer NO.\n">;
export type RelevancyRefinePrompt = PromptTemplate<[
    "query",
    "existingAnswer",
    "contextMsg"
]>;
