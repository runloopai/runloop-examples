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
import { CachedContent, ListCachedContentsResponse } from '../types';
import { ApiClient } from './shared/api_client';
export declare function inferFullResourceName(project: string, location: string, cachedContentId: string): string;
/**
 * Infers the full model name based on the provided project, location, and model.
 *
 * @internal
 */
export declare function inferModelName(project: string, location: string, model?: string): string;
/**
 * This class is for managing Vertex AI's CachedContent resource.
 * @public
 */
export declare class CachedContents {
    private readonly client;
    constructor(client: ApiClient);
    /**
     * Creates cached content, this call will initialize the cached content in the data storage, and users need to pay for the cache data storage.
     * @param cachedContent
     * @param parent - Required. The parent resource where the cached content will be created.
     */
    create(cachedContent: CachedContent): Promise<CachedContent>;
    /**
     * Updates cached content configurations
     *
     * @param updateMask - Required. The list of fields to update. Format: google-fieldmask. See {@link https://cloud.google.com/docs/discovery/type-format}
     * @param name - Immutable. Identifier. The server-generated resource name of the cached content Format: projects/{project}/locations/{location}/cachedContents/{cached_content}.
     */
    update(cachedContent: CachedContent, updateMask: string[]): Promise<CachedContent>;
    /**
     * Deletes cached content.
     *
     * @param name - Required. The resource name referring to the cached content.
     */
    delete(name: string): Promise<void>;
    /**
     * Lists cached contents in a project.
     *
     * @param pageSize - Optional. The maximum number of cached contents to return. The service may return fewer than this value. If unspecified, some default (under maximum) number of items will be returned. The maximum value is 1000; values above 1000 will be coerced to 1000.
     * @param pageToken - Optional. A page token, received from a previous `ListCachedContents` call. Provide this to retrieve the subsequent page. When paginating, all other parameters provided to `ListCachedContents` must match the call that provided the page token.
     */
    list(pageSize?: number, pageToken?: string): Promise<ListCachedContentsResponse>;
    /**
     * Gets cached content configurations.
     *
     * @param name - Required. The resource name referring to the cached content.
     */
    get(name: string): Promise<CachedContent>;
}
