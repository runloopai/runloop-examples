import type { BaseArgs, Options } from "../../types";
export type VisualQuestionAnsweringArgs = BaseArgs & {
    inputs: {
        /**
         * Raw image
         *
         * You can use native `File` in browsers, or `new Blob([buffer])` in node, or for a base64 image `new Blob([btoa(base64String)])`, or even `await (await fetch('...)).blob()`
         **/
        image: Blob | ArrayBuffer;
        question: string;
    };
};
export interface VisualQuestionAnsweringOutput {
    /**
     * A string that’s the answer to a visual question.
     */
    answer: string;
    /**
     * Answer correctness score.
     */
    score: number;
}
/**
 * Answers a question on an image. Recommended model: dandelin/vilt-b32-finetuned-vqa.
 */
export declare function visualQuestionAnswering(args: VisualQuestionAnsweringArgs, options?: Options): Promise<VisualQuestionAnsweringOutput>;
//# sourceMappingURL=visualQuestionAnswering.d.ts.map