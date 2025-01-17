import type { BaseArgs, Options } from "../../types";
export type DocumentQuestionAnsweringArgs = BaseArgs & {
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
export interface DocumentQuestionAnsweringOutput {
    /**
     * A string that’s the answer within the document.
     */
    answer: string;
    /**
     * ?
     */
    end?: number;
    /**
     * A float that represents how likely that the answer is correct
     */
    score?: number;
    /**
     * ?
     */
    start?: number;
}
/**
 * Answers a question on a document image. Recommended model: impira/layoutlm-document-qa.
 */
export declare function documentQuestionAnswering(args: DocumentQuestionAnsweringArgs, options?: Options): Promise<DocumentQuestionAnsweringOutput>;
//# sourceMappingURL=documentQuestionAnswering.d.ts.map