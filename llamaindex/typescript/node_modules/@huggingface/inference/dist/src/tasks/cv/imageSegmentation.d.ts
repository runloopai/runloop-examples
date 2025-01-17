import type { BaseArgs, Options } from "../../types";
export type ImageSegmentationArgs = BaseArgs & {
    /**
     * Binary image data
     */
    data: Blob | ArrayBuffer;
};
export interface ImageSegmentationOutputValue {
    /**
     * The label for the class (model specific) of a segment.
     */
    label: string;
    /**
     * A str (base64 str of a single channel black-and-white img) representing the mask of a segment.
     */
    mask: string;
    /**
     * A float that represents how likely it is that the detected object belongs to the given class.
     */
    score: number;
}
export type ImageSegmentationOutput = ImageSegmentationOutputValue[];
/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50-panoptic
 */
export declare function imageSegmentation(args: ImageSegmentationArgs, options?: Options): Promise<ImageSegmentationOutput>;
//# sourceMappingURL=imageSegmentation.d.ts.map