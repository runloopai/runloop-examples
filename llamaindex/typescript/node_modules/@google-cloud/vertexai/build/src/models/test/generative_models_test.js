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
const util_1 = require("../../util");
const generative_models_1 = require("../generative_models");
const types_1 = require("../../types");
const GenerateContentFunctions = require("../../functions/generate_content");
const CountTokensFunctions = require("../../functions/count_tokens");
const fake_google_auth_1 = require("../../testing/fake_google_auth");
const PROJECT = 'test_project';
const LOCATION = 'test_location';
const MODEL_NAME = 'model-name';
const RESOURCE_PATH = `projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL_NAME}`;
const TEST_TOKEN = 'testtoken';
const FAKE_GOOGLE_AUTH = (0, fake_google_auth_1.createFakeGoogleAuth)({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
    accessToken: TEST_TOKEN,
});
const TEST_CHAT_MESSSAGE_TEXT = 'How are you doing today?';
const TEST_USER_CONTENT_MESSAGE = {
    contents: [
        { role: util_1.constants.USER_ROLE, parts: [{ text: TEST_CHAT_MESSSAGE_TEXT }] },
    ],
};
const TEST_SAFETY_SETTINGS = [
    {
        category: types_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: types_1.HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];
const TEST_GENERATION_CONFIG = {
    candidateCount: 1,
    stopSequences: ['hello'],
};
const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';
const TEST_TOOLS_WITH_FUNCTION_DECLARATION = [
    {
        functionDeclarations: [
            {
                name: 'get_current_weather',
                description: 'get weather in a given location',
                parameters: {
                    type: types_1.FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                        location: { type: types_1.FunctionDeclarationSchemaType.STRING },
                        unit: {
                            type: types_1.FunctionDeclarationSchemaType.STRING,
                            enum: ['celsius', 'fahrenheit'],
                        },
                    },
                    required: ['location'],
                },
            },
        ],
    },
];
const TEST_TOOLS_CONFIG = {
    functionCallingConfig: {
        mode: types_1.FunctionCallingMode.ANY,
        allowedFunctionNames: ['get_current_weather'],
    },
};
const TEST_REQUEST_OPTIONS = {
    timeout: 0,
};
const TEST_SYSTEM_INSTRUCTION = {
    role: util_1.constants.SYSTEM_ROLE,
    parts: [{ text: 'system instruction' }],
};
const TEST_SYSTEM_INSTRUCTION_WRONG_ROLE = {
    role: 'WRONG_ROLE',
    parts: [{ text: 'system instruction' }],
};
const BASE_MODEL_PARAMS = {
    project: PROJECT,
    location: LOCATION,
    auth: FAKE_GOOGLE_AUTH,
};
describe('', () => {
    const modelTestCases = [
        {
            createModel: (param) => new generative_models_1.GenerativeModel(param),
            isPreviewModel: false,
        },
        {
            createModel: (param) => new generative_models_1.GenerativeModelPreview(param),
            isPreviewModel: true,
        },
    ];
    describe('generate method should call internal function', () => {
        const testCases = [
            {
                name: 'when passed a string prompt',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                },
                generateContentParams: TEST_CHAT_MESSSAGE_TEXT,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining(TEST_USER_CONTENT_MESSAGE),
                    apiEndpoint: undefined,
                    generationConfig: undefined,
                    safetySettings: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    requestOptions: {},
                }),
            },
            {
                name: 'when passed a object prompt',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                },
                generateContentParams: TEST_USER_CONTENT_MESSAGE,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining(TEST_USER_CONTENT_MESSAGE),
                    apiEndpoint: undefined,
                    generationConfig: undefined,
                    safetySettings: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    requestOptions: {},
                }),
            },
            {
                name: 'when the model name has `models` prefix',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: 'models/model-name',
                    googleAuth: FAKE_GOOGLE_AUTH,
                },
                generateContentParams: TEST_CHAT_MESSSAGE_TEXT,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining(TEST_USER_CONTENT_MESSAGE),
                    apiEndpoint: undefined,
                    generationConfig: undefined,
                    safetySettings: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    requestOptions: {},
                }),
            },
            {
                name: 'when the model name has `project` prefix',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: 'projects/my-project/locations/my-location/models/my-tuned-model',
                    googleAuth: FAKE_GOOGLE_AUTH,
                },
                generateContentParams: TEST_CHAT_MESSSAGE_TEXT,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: 'projects/my-project/locations/my-location/models/my-tuned-model',
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining(TEST_USER_CONTENT_MESSAGE),
                    apiEndpoint: undefined,
                    generationConfig: undefined,
                    safetySettings: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    requestOptions: {},
                }),
            },
            {
                name: 'when pass params at model constructor level',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                    apiEndpoint: TEST_ENDPOINT_BASE_PATH,
                    generationConfig: TEST_GENERATION_CONFIG,
                    systemInstruction: TEST_SYSTEM_INSTRUCTION,
                    tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
                    toolConfig: TEST_TOOLS_CONFIG,
                    safetySettings: TEST_SAFETY_SETTINGS,
                    requestOptions: TEST_REQUEST_OPTIONS,
                },
                generateContentParams: TEST_CHAT_MESSSAGE_TEXT,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining({
                        systemInstruction: TEST_SYSTEM_INSTRUCTION,
                        ...TEST_USER_CONTENT_MESSAGE,
                    }),
                    apiEndpoint: TEST_ENDPOINT_BASE_PATH,
                    generationConfig: TEST_GENERATION_CONFIG,
                    safetySettings: TEST_SAFETY_SETTINGS,
                    tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
                    toolConfig: TEST_TOOLS_CONFIG,
                    requestOptions: TEST_REQUEST_OPTIONS,
                }),
            },
            {
                name: 'when pass params at model constructor level',
                previewOnly: true,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                    apiEndpoint: TEST_ENDPOINT_BASE_PATH,
                    generationConfig: TEST_GENERATION_CONFIG,
                    systemInstruction: TEST_SYSTEM_INSTRUCTION,
                    tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
                    toolConfig: TEST_TOOLS_CONFIG,
                    safetySettings: TEST_SAFETY_SETTINGS,
                    requestOptions: TEST_REQUEST_OPTIONS,
                    cachedContent: { name: 'cachedContentName' },
                },
                generateContentParams: TEST_CHAT_MESSSAGE_TEXT,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining({
                        systemInstruction: TEST_SYSTEM_INSTRUCTION,
                        ...TEST_USER_CONTENT_MESSAGE,
                        cachedContent: 'cachedContentName',
                    }),
                    apiEndpoint: TEST_ENDPOINT_BASE_PATH,
                    generationConfig: TEST_GENERATION_CONFIG,
                    safetySettings: TEST_SAFETY_SETTINGS,
                    tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
                    toolConfig: TEST_TOOLS_CONFIG,
                    requestOptions: TEST_REQUEST_OPTIONS,
                }),
            },
            {
                name: 'when pass params at model method level',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                    apiEndpoint: TEST_ENDPOINT_BASE_PATH,
                    generationConfig: undefined,
                    systemInstruction: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    safetySettings: undefined,
                    requestOptions: TEST_REQUEST_OPTIONS,
                },
                generateContentParams: {
                    ...TEST_USER_CONTENT_MESSAGE,
                    generationConfig: TEST_GENERATION_CONFIG,
                    systemInstruction: TEST_SYSTEM_INSTRUCTION,
                    tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
                    toolConfig: TEST_TOOLS_CONFIG,
                    safetySettings: TEST_SAFETY_SETTINGS,
                },
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining({
                        ...TEST_USER_CONTENT_MESSAGE,
                        systemInstruction: TEST_SYSTEM_INSTRUCTION,
                        generationConfig: TEST_GENERATION_CONFIG,
                        tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
                        toolConfig: TEST_TOOLS_CONFIG,
                        safetySettings: TEST_SAFETY_SETTINGS,
                    }),
                    apiEndpoint: TEST_ENDPOINT_BASE_PATH,
                    generationConfig: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    safetySettings: undefined,
                    requestOptions: TEST_REQUEST_OPTIONS,
                }),
            },
            {
                name: 'when set system instruction(wrong role) in model constructor',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                    systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
                },
                generateContentParams: TEST_CHAT_MESSSAGE_TEXT,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining({
                        systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
                        ...TEST_USER_CONTENT_MESSAGE,
                    }),
                    apiEndpoint: undefined,
                    generationConfig: undefined,
                    safetySettings: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    requestOptions: {},
                }),
            },
            {
                name: 'when set system instruction(wrong role) in model method level',
                previewOnly: false,
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                },
                generateContentParams: {
                    ...TEST_USER_CONTENT_MESSAGE,
                    systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
                },
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: jasmine.objectContaining({
                        ...TEST_USER_CONTENT_MESSAGE,
                        systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
                    }),
                    apiEndpoint: undefined,
                    generationConfig: undefined,
                    safetySettings: undefined,
                    tools: undefined,
                    toolConfig: undefined,
                    requestOptions: {},
                }),
            },
        ]
            .flatMap(testCase => modelTestCases.map((modelTestCase) => ({
            createModel: modelTestCase.createModel,
            isPreviewModel: modelTestCase.isPreviewModel,
            ...testCase,
        })))
            .filter((testCase) => !testCase.previewOnly ||
            (testCase.previewOnly && testCase.isPreviewModel));
        testCases.forEach((testCase) => {
            it(`${testCase.name} when call generateContent (isPreviewModel=${testCase.isPreviewModel})`, async () => {
                const model = testCase.createModel(testCase.modelParams);
                const generateContentSpy = spyOn(GenerateContentFunctions, 'generateContent');
                await model.generateContent(testCase.generateContentParams);
                const expectedParams = testCase.expectedParams;
                expect(generateContentSpy).toHaveBeenCalledWith(...expectedParams);
            });
        });
        testCases
            .filter((testCase) => !testCase.previewOnly ||
            (testCase.previewOnly && testCase.isPreviewModel))
            .forEach((testCase) => {
            it(`${testCase.name} when call generateContentStream (isPreviewModel=${testCase.isPreviewModel})`, async () => {
                const model = testCase.createModel(testCase.modelParams);
                const generateContentSpy = spyOn(GenerateContentFunctions, 'generateContentStream');
                await model.generateContentStream(testCase.generateContentParams);
                const expectedParams = testCase.expectedParams;
                expect(generateContentSpy).toHaveBeenCalledWith(...expectedParams);
            });
        });
    });
    describe('countTokens method should call internal function', () => {
        const testCases = [
            {
                name: 'call internal countTokens when passed a object prompt',
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                },
                countTokensRequest: TEST_USER_CONTENT_MESSAGE,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: TEST_USER_CONTENT_MESSAGE,
                    apiEndpoint: undefined,
                    requestOptions: {},
                }),
            },
            {
                name: 'call internal counTokens when set timeout request option',
                modelParams: {
                    ...BASE_MODEL_PARAMS,
                    model: MODEL_NAME,
                    googleAuth: FAKE_GOOGLE_AUTH,
                    requestOptions: TEST_REQUEST_OPTIONS,
                },
                countTokensRequest: TEST_USER_CONTENT_MESSAGE,
                expectedParams: Object.values({
                    location: LOCATION,
                    resourcePath: RESOURCE_PATH,
                    token: jasmine.any(Promise),
                    request: TEST_USER_CONTENT_MESSAGE,
                    apiEndpoint: undefined,
                    requestOptions: TEST_REQUEST_OPTIONS,
                }),
            },
        ]
            .flatMap(testCase => modelTestCases.map((modelTestCase) => ({
            createModel: modelTestCase.createModel,
            isPreviewModel: modelTestCase.isPreviewModel,
            ...testCase,
        })))
            .filter((testCase) => !testCase.previewOnly ||
            (testCase.previewOnly && testCase.isPreviewModel));
        testCases.forEach((testCase) => {
            it(`${testCase.name} when call countTokens`, async () => {
                const model = testCase.createModel(testCase.modelParams);
                const countTokensSpy = spyOn(CountTokensFunctions, 'countTokens');
                await model.countTokens(testCase.countTokensRequest);
                const expectedParams = testCase.expectedParams;
                expect(countTokensSpy).toHaveBeenCalledWith(...expectedParams);
            });
        });
    });
});
//# sourceMappingURL=generative_models_test.js.map