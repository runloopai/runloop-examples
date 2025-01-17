export const defaultEvaluationParser = (evalResponse)=>{
    const [scoreStr, reasoningStr] = evalResponse.split("\n");
    const score = parseFloat(scoreStr);
    const reasoning = reasoningStr.trim();
    return [
        score,
        reasoning
    ];
};
