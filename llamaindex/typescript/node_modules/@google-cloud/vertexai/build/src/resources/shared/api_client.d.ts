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
import { GoogleAuth } from 'google-auth-library';
export declare class ApiClient {
    readonly project: string;
    readonly location: string;
    readonly apiVersion: 'v1' | 'v1beta1';
    private readonly googleAuth;
    constructor(project: string, location: string, apiVersion: 'v1' | 'v1beta1', googleAuth: GoogleAuth);
    /**
     * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
     * fails.
     * @returns Promise of token string.
     */
    private fetchToken;
    getBaseUrl(): string;
    getBaseResourePath(): string;
    unaryApiCall(url: URL, requestInit: RequestInit, httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE'): Promise<any>;
    private apiCall;
    private getHeaders;
}
