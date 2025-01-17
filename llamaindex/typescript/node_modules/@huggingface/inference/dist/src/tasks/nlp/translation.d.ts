import type { BaseArgs, Options } from "../../types";
export type TranslationArgs = BaseArgs & {
    /**
     * A string to be translated
     */
    inputs: string | string[];
};
export interface TranslationOutputValue {
    /**
     * The string after translation
     */
    translation_text: string;
}
export type TranslationOutput = TranslationOutputValue | TranslationOutputValue[];
/**
 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
 */
export declare function translation(args: TranslationArgs, options?: Options): Promise<TranslationOutput>;
//# sourceMappingURL=translation.d.ts.map