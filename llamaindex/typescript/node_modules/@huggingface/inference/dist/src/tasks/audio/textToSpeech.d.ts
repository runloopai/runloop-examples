import type { BaseArgs, Options } from "../../types";
export type TextToSpeechArgs = BaseArgs & {
    /**
     * The text to generate an audio from
     */
    inputs: string;
};
export type TextToSpeechOutput = Blob;
/**
 * This task synthesize an audio of a voice pronouncing a given text.
 * Recommended model: espnet/kan-bayashi_ljspeech_vits
 */
export declare function textToSpeech(args: TextToSpeechArgs, options?: Options): Promise<TextToSpeechOutput>;
//# sourceMappingURL=textToSpeech.d.ts.map