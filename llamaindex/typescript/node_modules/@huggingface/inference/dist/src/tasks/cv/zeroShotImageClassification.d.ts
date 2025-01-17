import type { BaseArgs, Options } from "../../types";
export type ZeroShotImageClassificationArgs = BaseArgs & {
    inputs: {
        /**
         * Binary image data
         */
        image: Blob | ArrayBuffer;
    };
    parameters: {
        /**
         * A list of strings that are potential classes for inputs. (max 10)
         */
        candidate_labels: string[];
    };
};
export interface ZeroShotImageClassificationOutputValue {
    label: string;
    score: number;
}
export type ZeroShotImageClassificationOutput = ZeroShotImageClassificationOutputValue[];
/**
 * Classify an image to specified classes.
 * Recommended model: openai/clip-vit-large-patch14-336
 */
export declare function zeroShotImageClassification(args: ZeroShotImageClassificationArgs, options?: Options): Promise<ZeroShotImageClassificationOutput>;
//# sourceMappingURL=zeroShotImageClassification.d.ts.map