import type { BaseArgs, Options } from "../../types";
export type ObjectDetectionArgs = BaseArgs & {
    /**
     * Binary image data
     */
    data: Blob | ArrayBuffer;
};
export interface ObjectDetectionOutputValue {
    /**
     * A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.
     */
    box: {
        xmax: number;
        xmin: number;
        ymax: number;
        ymin: number;
    };
    /**
     * The label for the class (model specific) of a detected object.
     */
    label: string;
    /**
     * A float that represents how likely it is that the detected object belongs to the given class.
     */
    score: number;
}
export type ObjectDetectionOutput = ObjectDetectionOutputValue[];
/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50
 */
export declare function objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionOutput>;
//# sourceMappingURL=objectDetection.d.ts.map