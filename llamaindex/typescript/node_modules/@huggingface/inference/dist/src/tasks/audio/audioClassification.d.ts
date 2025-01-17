import type { BaseArgs, Options } from "../../types";
export type AudioClassificationArgs = BaseArgs & {
    /**
     * Binary audio data
     */
    data: Blob | ArrayBuffer;
};
export interface AudioClassificationOutputValue {
    /**
     * The label for the class (model specific)
     */
    label: string;
    /**
     * A float that represents how likely it is that the audio file belongs to this class.
     */
    score: number;
}
export type AudioClassificationReturn = AudioClassificationOutputValue[];
/**
 * This task reads some audio input and outputs the likelihood of classes.
 * Recommended model:  superb/hubert-large-superb-er
 */
export declare function audioClassification(args: AudioClassificationArgs, options?: Options): Promise<AudioClassificationReturn>;
//# sourceMappingURL=audioClassification.d.ts.map