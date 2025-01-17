import type { BaseNode } from "@llamaindex/core/schema";
export type NodeFormatterFunction = (summaryNodes: BaseNode[]) => string;
export declare const defaultFormatNodeBatchFn: NodeFormatterFunction;
export type ChoiceSelectParseResult = {
    [docNumber: number]: number;
};
export type ChoiceSelectParserFunction = (answer: string, numChoices: number, raiseErr?: boolean) => ChoiceSelectParseResult;
export declare const defaultParseChoiceSelectAnswerFn: ChoiceSelectParserFunction;
