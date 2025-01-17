Object.defineProperty(exports, '__esModule', { value: true });

let transformer = null;
function getTransformers() {
    return transformer;
}
function setTransformers(t) {
    transformer = t;
}

async function loadTransformers(onLoad) {
    const nodeVersions = process.versions.node.split(".");
    if (nodeVersions[0] && parseInt(nodeVersions[0], 10) < 20) {
        throw new Error("@huggingface/transformers is not supported on Node.js versions below 20");
    }
    if (getTransformers() === null) {
        setTransformers(await import('@huggingface/transformers'));
    } else {
        return getTransformers();
    }
    const transformer = getTransformers();
    onLoad(transformer);
    return transformer;
}

exports.loadTransformers = loadTransformers;
exports.setTransformers = setTransformers;
