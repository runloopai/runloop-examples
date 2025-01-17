// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { resolveBackendAndExecutionProviders } from './backend-impl.js';
import { Tensor } from './tensor.js';
const noBackendErrMsg = 'Training backend could not be resolved. ' + "Make sure you're using the correct configuration & WebAssembly files.";
export class TrainingSession {
    constructor(handler, hasOptimizerModel, hasEvalModel) {
        this.handler = handler;
        this.hasOptimizerModel = hasOptimizerModel;
        this.hasEvalModel = hasEvalModel;
    }
    get trainingInputNames() {
        return this.handler.inputNames;
    }
    get trainingOutputNames() {
        return this.handler.outputNames;
    }
    get evalInputNames() {
        if (this.hasEvalModel) {
            return this.handler.evalInputNames;
        }
        else {
            throw new Error('This training session has no evalModel loaded.');
        }
    }
    get evalOutputNames() {
        if (this.hasEvalModel) {
            return this.handler.evalOutputNames;
        }
        else {
            throw new Error('This training session has no evalModel loaded.');
        }
    }
    static async create(trainingOptions, sessionOptions) {
        const evalModel = trainingOptions.evalModel || '';
        const optimizerModel = trainingOptions.optimizerModel || '';
        const options = sessionOptions || {};
        // resolve backend, update session options with validated EPs, and create session handler
        const [backend, optionsWithValidatedEPs] = await resolveBackendAndExecutionProviders(options);
        if (backend.createTrainingSessionHandler) {
            const handler = await backend.createTrainingSessionHandler(trainingOptions.checkpointState, trainingOptions.trainModel, evalModel, optimizerModel, optionsWithValidatedEPs);
            return new TrainingSession(handler, !!trainingOptions.optimizerModel, !!trainingOptions.evalModel);
        }
        else {
            throw new Error(noBackendErrMsg);
        }
    }
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
    typeNarrowingForRunStep(inputNames, outputNames, feeds, arg1, arg2) {
        const fetches = {};
        let options = {};
        // check inputs
        if (typeof feeds !== 'object' || feeds === null || feeds instanceof Tensor || Array.isArray(feeds)) {
            throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
        }
        let isFetchesEmpty = true;
        // determine which override is being used
        if (typeof arg1 === 'object') {
            if (arg1 === null) {
                throw new TypeError('Unexpected argument[1]: cannot be null.');
            }
            if (arg1 instanceof Tensor) {
                throw new TypeError("'fetches' cannot be a Tensor");
            }
            if (Array.isArray(arg1)) {
                if (arg1.length === 0) {
                    throw new TypeError("'fetches' cannot be an empty array.");
                }
                isFetchesEmpty = false;
                // output names
                for (const name of arg1) {
                    if (typeof name !== 'string') {
                        throw new TypeError("'fetches' must be a string array or an object.");
                    }
                    if (outputNames.indexOf(name) === -1) {
                        throw new RangeError(`'fetches' contains invalid output name: ${name}.`);
                    }
                    fetches[name] = null;
                }
                if (typeof arg2 === 'object' && arg2 !== null) {
                    options = arg2;
                }
                else if (typeof arg2 !== 'undefined') {
                    throw new TypeError("'options' must be an object.");
                }
            }
            else {
                // decide whether arg1 is fetches or options
                // if any output name is present and its value is valid OnnxValue, we consider it fetches
                let isFetches = false;
                const arg1Keys = Object.getOwnPropertyNames(arg1);
                for (const name of outputNames) {
                    if (arg1Keys.indexOf(name) !== -1) {
                        const v = arg1[name];
                        if (v === null || v instanceof Tensor) {
                            isFetches = true;
                            isFetchesEmpty = false;
                            fetches[name] = v;
                        }
                    }
                }
                if (isFetches) {
                    if (typeof arg2 === 'object' && arg2 !== null) {
                        options = arg2;
                    }
                    else if (typeof arg2 !== 'undefined') {
                        throw new TypeError("'options' must be an object.");
                    }
                }
                else {
                    options = arg1;
                }
            }
        }
        else if (typeof arg1 !== 'undefined') {
            throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
        }
        // check if all inputs are in feed
        for (const name of inputNames) {
            if (typeof feeds[name] === 'undefined') {
                throw new Error(`input '${name}' is missing in 'feeds'.`);
            }
        }
        // if no fetches is specified, we use the full output names list
        if (isFetchesEmpty) {
            for (const name of outputNames) {
                fetches[name] = null;
            }
        }
        return [fetches, options];
    }
    /**
     * Helper method for runTrainStep and any other runStep methods. Takes the ReturnType result from the SessionHandler
     * and changes it into a map of Tensors.
     *
     * @param results
     * @returns
     */
    convertHandlerReturnTypeToMapOfTensors(results) {
        const returnValue = {};
        for (const key in results) {
            if (Object.hasOwnProperty.call(results, key)) {
                const result = results[key];
                if (result instanceof Tensor) {
                    returnValue[key] = result;
                }
                else {
                    returnValue[key] = new Tensor(result.type, result.data, result.dims);
                }
            }
        }
        return returnValue;
    }
    async lazyResetGrad() {
        await this.handler.lazyResetGrad();
    }
    async runTrainStep(feeds, arg1, arg2) {
        const [fetches, options] = this.typeNarrowingForRunStep(this.trainingInputNames, this.trainingOutputNames, feeds, arg1, arg2);
        const results = await this.handler.runTrainStep(feeds, fetches, options);
        return this.convertHandlerReturnTypeToMapOfTensors(results);
    }
    async runOptimizerStep(options) {
        if (this.hasOptimizerModel) {
            await this.handler.runOptimizerStep(options || {});
        }
        else {
            throw new Error('This TrainingSession has no OptimizerModel loaded.');
        }
    }
    async runEvalStep(feeds, arg1, arg2) {
        if (this.hasEvalModel) {
            const [fetches, options] = this.typeNarrowingForRunStep(this.evalInputNames, this.evalOutputNames, feeds, arg1, arg2);
            const results = await this.handler.runEvalStep(feeds, fetches, options);
            return this.convertHandlerReturnTypeToMapOfTensors(results);
        }
        else {
            throw new Error('This TrainingSession has no EvalModel loaded.');
        }
    }
    async getParametersSize(trainableOnly = true) {
        return this.handler.getParametersSize(trainableOnly);
    }
    async loadParametersBuffer(array, trainableOnly = true) {
        const paramsSize = await this.getParametersSize(trainableOnly);
        // checking that the size of the Uint8Array is equivalent to the byte length of a Float32Array of the number
        // of parameters
        if (array.length !== 4 * paramsSize) {
            throw new Error('Size of the buffer passed into loadParametersBuffer must match the number of parameters in ' +
                'the model. Please use getParametersSize method to check.');
        }
        return this.handler.loadParametersBuffer(array, trainableOnly);
    }
    async getContiguousParameters(trainableOnly = true) {
        return this.handler.getContiguousParameters(trainableOnly);
    }
    async release() {
        return this.handler.dispose();
    }
}
//# sourceMappingURL=training-session-impl.js.map