"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prerelease = void 0;
function prerelease(apiVersion) {
    return function (target, propertyKey, descriptor) {
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var warnmsg = "This is a prerelease feature implemented against the ".concat(apiVersion, " version of our API.");
            console.warn(warnmsg);
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
exports.prerelease = prerelease;
//# sourceMappingURL=prerelease.js.map