import type { BaseArgs, Options } from "../../types";
export type ImageClassificationArgs = BaseArgs & {
    /**
     * Binary image data
     */
    data: Blob | ArrayBuffer;
};
export interface ImageClassificationOutputValue {
    /**
     * The label for the class (model specific)
     */
    label: string;
    /**
     * A float that represents how likely it is that the image file belongs to this class.
     */
    score: number;
}
export type ImageClassificationOutput = ImageClassificationOutputValue[];
/**
 * This task reads some image input and outputs the likelihood of classes.
 * Recommended model: google/vit-base-patch16-224
 */
export declare function imageClassification(args: ImageClassificationArgs, options?: Options): Promise<ImageClassificationOutput>;
//# sourceMappingURL=imageClassification.d.ts.map