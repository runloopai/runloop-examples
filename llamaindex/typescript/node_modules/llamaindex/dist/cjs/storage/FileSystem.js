// FS utility helpers
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    exists: function() {
        return exists;
    },
    walk: function() {
        return walk;
    }
});
const _env = require("@llamaindex/env");
async function exists(path) {
    try {
        await _env.fs.access(path);
        return true;
    } catch  {
        return false;
    }
}
async function* walk(dirPath) {
    const entries = await _env.fs.readdir(dirPath);
    for (const entry of entries){
        const fullPath = `${dirPath}/${entry}`;
        const stats = await _env.fs.stat(fullPath);
        if (stats.isDirectory()) {
            yield* walk(fullPath);
        } else {
            yield fullPath;
        }
    }
}
