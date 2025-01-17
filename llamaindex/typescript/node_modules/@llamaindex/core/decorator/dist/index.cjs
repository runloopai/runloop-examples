Object.defineProperty(exports, '__esModule', { value: true });

var env = require('@llamaindex/env');
var index_cjs = require('../../global/dist/index.cjs');
var index_cjs$1 = require('../../utils/dist/index.cjs');

function wrapEventCaller(originalMethod, context) {
    const name = context.name;
    context.addInitializer(function() {
        // @ts-expect-error - this is a valid assignment
        const fn = this[name].bind(this);
        // @ts-expect-error - this is a valid assignment
        this[name] = (...args)=>{
            return index_cjs.withEventCaller(this, ()=>fn(...args));
        };
    });
    return function(...args) {
        const result = originalMethod.call(this, ...args);
        // patch for iterators because AsyncLocalStorage doesn't work with them
        if (index_cjs$1.isAsyncIterable(result)) {
            const iter = result[Symbol.asyncIterator]();
            const snapshot = env.AsyncLocalStorage.snapshot();
            return async function* asyncGeneratorWrapper() {
                while(true){
                    const { value, done } = await snapshot(()=>iter.next());
                    if (done) {
                        break;
                    }
                    yield value;
                }
            }();
        } else if (index_cjs$1.isIterable(result)) {
            const iter = result[Symbol.iterator]();
            const snapshot = env.AsyncLocalStorage.snapshot();
            return function* generatorWrapper() {
                while(true){
                    const { value, done } = snapshot(()=>iter.next());
                    if (done) {
                        break;
                    }
                    yield value;
                }
            }();
        }
        return result;
    };
}

function lazyInitHash(value, _context) {
    return {
        get () {
            const oldValue = value.get.call(this);
            if (oldValue === "") {
                const hash = this.generateHash();
                value.set.call(this, hash);
            }
            return value.get.call(this);
        },
        set (newValue) {
            value.set.call(this, newValue);
        },
        init (value) {
            return value;
        }
    };
}

function wrapLLMEvent(originalMethod, _context) {
    return async function withLLMEvent(...params) {
        const id = env.randomUUID();
        index_cjs.Settings.callbackManager.dispatchEvent("llm-start", {
            id,
            messages: params[0].messages
        });
        const response = await originalMethod.call(this, ...params);
        if (Symbol.asyncIterator in response) {
            // save snapshot to restore it after the response is done
            const snapshot = env.AsyncLocalStorage.snapshot();
            const originalAsyncIterator = {
                [Symbol.asyncIterator]: response[Symbol.asyncIterator].bind(response)
            };
            response[Symbol.asyncIterator] = async function*() {
                const finalResponse = {
                    raw: [],
                    message: {
                        content: "",
                        role: "assistant",
                        options: {}
                    }
                };
                let firstOne = false;
                for await (const chunk of originalAsyncIterator){
                    if (!firstOne) {
                        firstOne = true;
                        finalResponse.message.content = chunk.delta;
                    } else {
                        finalResponse.message.content += chunk.delta;
                    }
                    if (chunk.options) {
                        finalResponse.message.options = {
                            ...finalResponse.message.options,
                            ...chunk.options
                        };
                    }
                    index_cjs.Settings.callbackManager.dispatchEvent("llm-stream", {
                        id,
                        chunk
                    });
                    finalResponse.raw.push(chunk);
                    yield chunk;
                }
                snapshot(()=>{
                    index_cjs.Settings.callbackManager.dispatchEvent("llm-end", {
                        id,
                        response: finalResponse
                    });
                });
            };
        } else {
            index_cjs.Settings.callbackManager.dispatchEvent("llm-end", {
                id,
                response
            });
        }
        return response;
    };
}

exports.lazyInitHash = lazyInitHash;
exports.wrapEventCaller = wrapEventCaller;
exports.wrapLLMEvent = wrapLLMEvent;
