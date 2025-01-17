import type { BaseArgs, Options } from "../../types";
export type ImageToTextArgs = BaseArgs & {
    /**
     * Binary image data
     */
    data: Blob | ArrayBuffer;
};
export interface ImageToTextOutput {
    /**
     * The generated caption
     */
    generated_text: string;
}
/**
 * This task reads some image input and outputs the text caption.
 */
export declare function imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextOutput>;
//# sourceMappingURL=imageToText.d.ts.map