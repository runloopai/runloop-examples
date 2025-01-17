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
exports.SchemaType = void 0;
/** This file contains interfaces that are usable in the types folder. */
/**
 * The list of OpenAPI data types
 * as defined by https://swagger.io/docs/specification/data-models/data-types/
 */
var SchemaType;
(function (SchemaType) {
    /** String type. */
    SchemaType["STRING"] = "STRING";
    /** Number type. */
    SchemaType["NUMBER"] = "NUMBER";
    /** Integer type. */
    SchemaType["INTEGER"] = "INTEGER";
    /** Boolean type. */
    SchemaType["BOOLEAN"] = "BOOLEAN";
    /** Array type. */
    SchemaType["ARRAY"] = "ARRAY";
    /** Object type. */
    SchemaType["OBJECT"] = "OBJECT";
})(SchemaType || (exports.SchemaType = SchemaType = {}));
//# sourceMappingURL=common.js.map