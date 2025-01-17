import * as _huggingface_transformers from '@huggingface/transformers';

declare function setTransformers(t: typeof _huggingface_transformers): void;
type OnLoad = (transformer: typeof _huggingface_transformers) => void;
type LoadTransformerEvent = {
    transformer: typeof _huggingface_transformers;
};

declare function loadTransformers(onLoad: OnLoad): Promise<typeof _huggingface_transformers>;

export { type LoadTransformerEvent, type OnLoad, loadTransformers, setTransformers };
