/**
 * This is a Next.js configuration file that is used to customize the build process.
 *
 * @example
 * ```js
 * // next.config.js
 * const withLlamaIndex = require("llamaindex/next")
 *
 * module.exports = withLlamaIndex({
 *  // Your Next.js configuration
 * })
 * ```
 *
 * This is only for Next.js projects, do not export this function on top-level.
 *
 * @module
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, // eslint-disable-next-line @typescript-eslint/no-explicit-any
"default", {
    enumerable: true,
    get: function() {
        return withLlamaIndex;
    }
});
const _nodemodule = require("node:module");
const require1 = (0, _nodemodule.createRequire)(require("url").pathToFileURL(__filename).toString());
const nextJsVersion = require1("next/package.json").version;
const is14OrLower = nextJsVersion.startsWith("14.") || nextJsVersion.startsWith("13.");
function withLlamaIndex(config) {
    // needed for transformers, see https://huggingface.co/docs/transformers.js/en/tutorials/next#step-2-install-and-configure-transformersjs
    if (is14OrLower) {
        config.experimental.serverComponentsExternalPackages = config.experimental.serverComponentsExternalPackages ?? [];
        config.experimental.serverComponentsExternalPackages.push("@huggingface/transformers");
    } else {
        config.serverExternalPackages = config.serverExternalPackages ?? [];
        config.serverExternalPackages.push("@huggingface/transformers");
    }
    const userWebpack = config.webpack;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.webpack = function(webpackConfig, options) {
        if (userWebpack) {
            webpackConfig = userWebpack(webpackConfig, options);
        }
        webpackConfig.resolve.alias = {
            ...webpackConfig.resolve.alias,
            "@google-cloud/vertexai": false
        };
        // Disable modules that are not supported in vercel edge runtime
        if (options?.nextRuntime === "edge") {
            webpackConfig.resolve.alias["replicate"] = false;
        }
        // Following lines will fix issues with onnxruntime-node when using pnpm
        // See: https://github.com/vercel/next.js/issues/43433
        const externals = {
            "onnxruntime-node": "commonjs onnxruntime-node",
            sharp: "commonjs sharp",
            chromadb: "chromadb",
            unpdf: "unpdf"
        };
        if (options?.nextRuntime === "nodejs") {
            externals.replicate = "commonjs replicate";
        }
        webpackConfig.externals.push(externals);
        return webpackConfig;
    };
    return config;
}
