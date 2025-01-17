"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "defaultEvaluationParser", {
    enumerable: true,
    get: function() {
        return defaultEvaluationParser;
    }
});
const defaultEvaluationParser = (evalResponse)=>{
    const [scoreStr, reasoningStr] = evalResponse.split("\n");
    const score = parseFloat(scoreStr);
    const reasoning = reasoningStr.trim();
    return [
        score,
        reasoning
    ];
};
