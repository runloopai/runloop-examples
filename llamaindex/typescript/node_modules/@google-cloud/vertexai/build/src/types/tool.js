"use strict";
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCallingMode = void 0;
/** Function calling mode. */
var FunctionCallingMode;
(function (FunctionCallingMode) {
    /** Unspecified function calling mode. This value should not be used. */
    FunctionCallingMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    /**
     * Default model behavior, model decides to predict either function calls
     * or natural language response.
     */
    FunctionCallingMode["AUTO"] = "AUTO";
    /**
     * Model is constrained to always predicting function calls only.
     * If "allowedFunctionNames" are set, the predicted function calls will be
     * limited to any one of "allowedFunctionNames", else the predicted
     * function calls will be any one of the provided "function_declarations".
     */
    FunctionCallingMode["ANY"] = "ANY";
    /**
     * Model will not predict any function calls. Model behavior is same as when
     * not passing any function declarations.
     */
    FunctionCallingMode["NONE"] = "NONE";
})(FunctionCallingMode || (exports.FunctionCallingMode = FunctionCallingMode = {}));
//# sourceMappingURL=tool.js.map