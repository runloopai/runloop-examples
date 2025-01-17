import type { BaseArgs, Options } from "../../types";
export type TableQuestionAnsweringArgs = BaseArgs & {
    inputs: {
        /**
         * The query in plain text that you want to ask the table
         */
        query: string;
        /**
         * A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size.
         */
        table: Record<string, string[]>;
    };
};
export interface TableQuestionAnsweringOutput {
    /**
     * The aggregator used to get the answer
     */
    aggregator: string;
    /**
     * The plaintext answer
     */
    answer: string;
    /**
     * A list of coordinates of the cells contents
     */
    cells: string[];
    /**
     * a list of coordinates of the cells referenced in the answer
     */
    coordinates: number[][];
}
/**
 * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
 */
export declare function tableQuestionAnswering(args: TableQuestionAnsweringArgs, options?: Options): Promise<TableQuestionAnsweringOutput>;
//# sourceMappingURL=tableQuestionAnswering.d.ts.map