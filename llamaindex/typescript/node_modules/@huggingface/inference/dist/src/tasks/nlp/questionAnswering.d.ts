import type { BaseArgs, Options } from "../../types";
export type QuestionAnsweringArgs = BaseArgs & {
    inputs: {
        context: string;
        question: string;
    };
};
export interface QuestionAnsweringOutput {
    /**
     * A string that’s the answer within the text.
     */
    answer: string;
    /**
     * The index (string wise) of the stop of the answer within context.
     */
    end: number;
    /**
     * A float that represents how likely that the answer is correct
     */
    score: number;
    /**
     * The index (string wise) of the start of the answer within context.
     */
    start: number;
}
/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export declare function questionAnswering(args: QuestionAnsweringArgs, options?: Options): Promise<QuestionAnsweringOutput>;
//# sourceMappingURL=questionAnswering.d.ts.map