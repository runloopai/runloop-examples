import type { BaseArgs, Options } from "../../types";
export type FeatureExtractionArgs = BaseArgs & {
    /**
     *  The inputs is a string or a list of strings to get the features from.
     *
     *  inputs: "That is a happy person",
     *
     */
    inputs: string | string[];
};
/**
 * Returned values are a multidimensional array of floats (dimension depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README).
 */
export type FeatureExtractionOutput = (number | number[] | number[][])[];
/**
 * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
 */
export declare function featureExtraction(args: FeatureExtractionArgs, options?: Options): Promise<FeatureExtractionOutput>;
//# sourceMappingURL=featureExtraction.d.ts.map