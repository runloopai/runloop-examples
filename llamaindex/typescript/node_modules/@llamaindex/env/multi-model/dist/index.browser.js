let transformer = null;
function getTransformers() {
    return transformer;
}
function setTransformers(t) {
    transformer = t;
}

async function loadTransformers(onLoad) {
    if (getTransformers() === null) {
        setTransformers(await import(// @ts-expect-error no type
        'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2'));
    } else {
        return getTransformers();
    }
    const transformer = getTransformers();
    onLoad(transformer);
    return transformer;
}

export { loadTransformers, setTransformers };
