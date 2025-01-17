import type { BaseArgs, Options } from "../../types";
export type AudioToAudioArgs = BaseArgs & {
    /**
     * Binary audio data
     */
    data: Blob | ArrayBuffer;
};
export interface AudioToAudioOutputValue {
    /**
     * The label for the audio output (model specific)
     */
    label: string;
    /**
     * Base64 encoded audio output.
     */
    blob: string;
    /**
     * Content-type for blob, e.g. audio/flac
     */
    "content-type": string;
}
export type AudioToAudioReturn = AudioToAudioOutputValue[];
/**
 * This task reads some audio input and outputs one or multiple audio files.
 * Example model: speechbrain/sepformer-wham does audio source separation.
 */
export declare function audioToAudio(args: AudioToAudioArgs, options?: Options): Promise<AudioToAudioReturn>;
//# sourceMappingURL=audioToAudio.d.ts.map