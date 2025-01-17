import { SessionHandler } from './backend.js';
import { InferenceSession as InferenceSession } from './inference-session.js';
import { OnnxValue } from './onnx-value.js';
import { TrainingSession as TrainingSessionInterface, TrainingSessionCreateOptions } from './training-session.js';
type SessionOptions = InferenceSession.SessionOptions;
type FeedsType = InferenceSession.FeedsType;
type FetchesType = InferenceSession.FetchesType;
type ReturnType = InferenceSession.ReturnType;
type RunOptions = InferenceSession.RunOptions;
export declare class TrainingSession implements TrainingSessionInterface {
    private constructor();
    private handler;
    private hasOptimizerModel;
    private hasEvalModel;
    get trainingInputNames(): readonly string[];
    get trainingOutputNames(): readonly string[];
    get evalInputNames(): readonly string[];
    get evalOutputNames(): readonly string[];
    static create(trainingOptions: TrainingSessionCreateOptions, sessionOptions?: SessionOptions): Promise<TrainingSession>;
    /**
     * Helper function for runTrainStep and future runStep methods that handles the type-narrowing conversion from
     * the given parameters to SessionHandler.FetchesType and RunOptions.
     *
     * @param inputNames the feeds object is checked that they contain all input names in the provided list of input
     * names.
     * @param outputNames the fetches object is checked that their keys match up with valid names in the list of output
     * names.
     * @param feeds the required input
     * @param arg1 narrowed & converted into the SessionHandler.FetchesType or RunOptions object
     * @param arg2 optional RunOptions object.
     * @returns
     */
    typeNarrowingForRunStep(inputNames: readonly string[], outputNames: readonly string[], feeds: FeedsType, arg1?: FetchesType | RunOptions, arg2?: RunOptions): [SessionHandler.FetchesType, RunOptions];
    /**
     * Helper method for runTrainStep and any other runStep methods. Takes the ReturnType result from the SessionHandler
     * and changes it into a map of Tensors.
     *
     * @param results
     * @returns
     */
    convertHandlerReturnTypeToMapOfTensors(results: SessionHandler.ReturnType): ReturnType;
    lazyResetGrad(): Promise<void>;
    runTrainStep(feeds: FeedsType, options?: RunOptions): Promise<ReturnType>;
    runTrainStep(feeds: FeedsType, fetches: FetchesType, options?: RunOptions): Promise<ReturnType>;
    runOptimizerStep(options?: InferenceSession.RunOptions | undefined): Promise<void>;
    runEvalStep(feeds: FeedsType, options?: RunOptions | undefined): Promise<ReturnType>;
    runEvalStep(feeds: FeedsType, fetches: FetchesType, options?: RunOptions | undefined): Promise<ReturnType>;
    getParametersSize(trainableOnly?: boolean): Promise<number>;
    loadParametersBuffer(array: Uint8Array, trainableOnly?: boolean): Promise<void>;
    getContiguousParameters(trainableOnly?: boolean): Promise<OnnxValue>;
    release(): Promise<void>;
}
export {};
//# sourceMappingURL=training-session-impl.d.ts.map