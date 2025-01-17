import type { BaseArgs, Options } from "../../types";
export type TextClassificationArgs = BaseArgs & {
    /**
     * A string to be classified
     */
    inputs: string;
};
export type TextClassificationOutput = {
    /**
     * The label for the class (model specific)
     */
    label: string;
    /**
     * A floats that represents how likely is that the text belongs to this class.
     */
    score: number;
}[];
/**
 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
 */
export declare function textClassification(args: TextClassificationArgs, options?: Options): Promise<TextClassificationOutput>;
//# sourceMappingURL=textClassification.d.ts.map