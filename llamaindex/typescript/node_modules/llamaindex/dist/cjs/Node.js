"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("@llamaindex/core/schema"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
console.warn('Package "llamaindex/Node" is deprecated, and will be removed in the next major release.');
console.warn("Please import from the @llamaindex/core/schema package instead.");
