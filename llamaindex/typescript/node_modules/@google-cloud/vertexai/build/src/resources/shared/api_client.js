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
exports.ApiClient = void 0;
const util_1 = require("../../util");
const types_1 = require("../../types");
const AUTHORIZATION_HEADER = 'Authorization';
const CONTENT_TYPE_HEADER = 'Content-Type';
const USER_AGENT_HEADER = 'User-Agent';
class ApiClient {
    constructor(project, location, apiVersion, googleAuth) {
        this.project = project;
        this.location = location;
        this.apiVersion = apiVersion;
        this.googleAuth = googleAuth;
    }
    /**
     * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
     * fails.
     * @returns Promise of token string.
     */
    fetchToken() {
        const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
            throw new types_1.GoogleAuthError(util_1.constants.CREDENTIAL_ERROR_MESSAGE, e);
        });
        return tokenPromise;
    }
    getBaseUrl() {
        return `https://${this.location}-aiplatform.googleapis.com/${this.apiVersion}`;
    }
    getBaseResourePath() {
        return `projects/${this.project}/locations/${this.location}`;
    }
    async unaryApiCall(url, requestInit, httpMethod) {
        const token = await this.getHeaders();
        return this.apiCall(url.toString(), {
            ...requestInit,
            method: httpMethod,
            headers: token,
        });
    }
    async apiCall(url, requestInit) {
        const response = await fetch(url, requestInit).catch(e => {
            throw new types_1.GoogleGenerativeAIError(`exception sending request to url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`, e);
        });
        await throwErrorIfNotOK(response, url, requestInit).catch(e => {
            throw e;
        });
        try {
            return await response.json();
        }
        catch (e) {
            throw new types_1.GoogleGenerativeAIError(JSON.stringify(response), e);
        }
    }
    async getHeaders() {
        const token = await this.fetchToken();
        return new Headers({
            [AUTHORIZATION_HEADER]: `Bearer ${token}`,
            [CONTENT_TYPE_HEADER]: 'application/json',
            [USER_AGENT_HEADER]: util_1.constants.USER_AGENT,
        });
    }
}
exports.ApiClient = ApiClient;
async function throwErrorIfNotOK(response, url, requestInit) {
    var _a;
    if (response === undefined) {
        throw new types_1.GoogleGenerativeAIError('response is undefined');
    }
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody;
        if ((_a = response.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('application/json')) {
            errorBody = await response.json();
        }
        else {
            errorBody = {
                error: {
                    message: `exception sending request to url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`,
                    code: response.status,
                    status: response.statusText,
                },
            };
        }
        const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(errorBody)}`;
        if (status >= 400 && status < 500) {
            const error = new types_1.ClientError(errorMessage, new types_1.GoogleApiError(errorBody.error.message, errorBody.error.code, errorBody.error.status, errorBody.error.details));
            throw error;
        }
        throw new types_1.GoogleGenerativeAIError(errorMessage);
    }
}
//# sourceMappingURL=api_client.js.map