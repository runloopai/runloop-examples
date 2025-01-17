"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_js_1 = require("./constants.js");
const GptEncoding_js_1 = require("./GptEncoding.js");
const mapping_js_1 = require("./mapping.js");
const resolveEncoding_js_1 = require("./resolveEncoding.js");
const sharedResults = {
    space: [220],
    tab: [197],
    'This is some text': [1_212, 318, 617, 2_420],
    indivisible: [521, 452, 12_843],
    'hello 👋 world 🌍': [31_373, 50_169, 233, 995, 12_520, 234, 235],
    decodedHelloWorldTokens: ['hello', ' ', '👋', ' world', ' ', '🌍'],
    'toString constructor hasOwnProperty valueOf': [
        1_462, 10_100, 23_772, 468, 23_858, 21_746, 1_988, 5_189,
    ],
    'hello, I am a text, and I have commas. a,b,c': [
        31_373, 11, 314, 716, 257, 2_420, 11, 290, 314, 423, 725, 292, 13, 257, 11,
        65, 11, 66,
    ],
};
const results = {
    o200k_base: {
        space: [220],
        tab: [197],
        'This is some text': [2_500, 382, 1_236, 2_201],
        indivisible: [521, 349, 181_386],
        'hello 👋 world 🌍': [24_912, 61_138, 233, 2_375, 130_321, 235],
        decodedHelloWorldTokens: ['hello', ' ', '👋', ' world', ' ', '🌍'],
        'toString constructor hasOwnProperty valueOf': [
            935, 916, 9_220, 853, 18_555, 3_895, 1_432, 2_566,
        ],
        'hello, I am a text, and I have commas. a,b,c': [
            24_912, 11, 357, 939, 261, 2_201, 11, 326, 357, 679, 179_663, 13, 261,
            17_568, 22_261,
        ],
    },
    cl100k_base: {
        space: [220],
        tab: [197],
        'This is some text': [2_028, 374, 1_063, 1_495],
        indivisible: [485, 344, 23_936],
        'hello 👋 world 🌍': [15_339, 62_904, 233, 1_917, 11_410, 234, 235],
        decodedHelloWorldTokens: ['hello', ' ', '👋', ' world', ' ', '🌍'],
        'toString constructor hasOwnProperty valueOf': [
            6_712, 4_797, 706, 19_964, 907, 2_173,
        ],
        'hello, I am a text, and I have commas. a,b,c': [
            15_339, 11, 358, 1_097, 264, 1_495, 11, 323, 358, 617, 77_702, 13, 264,
            8_568, 10_317,
        ],
    },
    p50k_base: sharedResults,
    p50k_edit: sharedResults,
    r50k_base: sharedResults,
};
const offsetPrompts = [
    // Basic prompt with "hello world"
    'hello world',
    // Basic prompt with special token "<|endoftext|>"
    'hello world<|endoftext|> green cow',
    // Chinese text: "我非常渴望与人工智能一起工作"
    '我非常渴望与人工智能一起工作',
    // Contains the interesting tokens b'\xe0\xae\xbf\xe0\xae' and b'\xe0\xaf\x8d\xe0\xae'
    // in which \xe0 is the start of a 3-byte UTF-8 character
    'நடிகர் சூர்யா',
    // Contains the interesting token b'\xa0\xe9\x99\xa4'
    // in which \xe9 is the start of a 3-byte UTF-8 character and \xa0 is a continuation byte
    ' Ġ除',
];
// eslint-disable-next-line @typescript-eslint/no-use-before-define
const testPlans = loadTestPlans();
describe.each(mapping_js_1.encodingNames)('%s', (encodingName) => {
    const encoding = GptEncoding_js_1.GptEncoding.getEncodingApi(encodingName, resolveEncoding_js_1.resolveEncoding);
    const { decode, decodeGenerator, decodeAsyncGenerator, encode, isWithinTokenLimit, } = encoding;
    describe('encode and decode', () => {
        it.each(offsetPrompts)('offset prompt: %s', (str) => {
            expect(decode(encode(str, { allowedSpecial: constants_js_1.ALL_SPECIAL_TOKENS }))).toEqual(str);
        });
    });
    describe('basic functionality', () => {
        const result = results[encodingName];
        it('empty string', () => {
            const str = '';
            expect(encode(str)).toEqual([]);
            expect(decode(encode(str))).toEqual(str);
            expect(isWithinTokenLimit(str, 0)).toBe(0);
            expect(isWithinTokenLimit(str, 3)).toBe(0);
        });
        it('space', () => {
            const str = ' ';
            expect(encode(str)).toEqual(result.space);
            expect(decode(encode(str))).toEqual(str);
            expect(isWithinTokenLimit(str, 3)).toBe(1);
            expect(isWithinTokenLimit(str, 0)).toBe(false);
        });
        it('tab', () => {
            const str = '\t';
            expect(encode(str)).toEqual(result.tab);
            expect(decode(encode(str))).toEqual(str);
        });
        it('simple text', () => {
            const str = 'This is some text';
            expect(encode(str)).toEqual(result[str]);
            expect(decode(encode(str))).toEqual(str);
            expect(isWithinTokenLimit(str, 3)).toBe(false);
            expect(isWithinTokenLimit(str, 5)).toBe(result[str].length);
        });
        it('multi-token word', () => {
            const str = 'indivisible';
            expect(encode(str)).toEqual(result.indivisible);
            expect(decode(encode(str))).toEqual(str);
            expect(isWithinTokenLimit(str, 3)).toBe(result.indivisible.length);
        });
        it('emojis', () => {
            const str = 'hello 👋 world 🌍';
            expect(encode(str)).toEqual(result[str]);
            expect(decode(encode(str))).toEqual(str);
            expect(isWithinTokenLimit(str, 4)).toBe(false);
            expect(isWithinTokenLimit(str, 400)).toBe(result[str].length);
        });
        it('decode token-by-token via generator', () => {
            const str = 'hello 👋 world 🌍';
            const generator = decodeGenerator(result[str]);
            result.decodedHelloWorldTokens.forEach((token) => {
                expect(generator.next().value).toBe(token);
            });
        });
        it('encodes and decodes special tokens', () => {
            const str = 'hello <|endoftext|> world';
            const encoded = encode(str, {
                allowedSpecial: constants_js_1.ALL_SPECIAL_TOKENS,
            });
            expect(decode(encoded)).toEqual(str);
        });
        async function* getHelloWorldTokensAsync() {
            const str = 'hello 👋 world 🌍';
            for (const token of result[str]) {
                // eslint-disable-next-line no-await-in-loop
                yield await Promise.resolve(token);
            }
        }
        it('decode token-by-token via async generator', async () => {
            const generator = decodeAsyncGenerator(getHelloWorldTokensAsync());
            const decoded = [...result.decodedHelloWorldTokens];
            for await (const value of generator) {
                expect(value).toEqual(decoded.shift());
            }
        });
        it('properties of Object', () => {
            const str = 'toString constructor hasOwnProperty valueOf';
            expect(encode(str)).toEqual(result[str]);
            expect(decode(encode(str))).toEqual(str);
        });
        it('text with commas', () => {
            const str = 'hello, I am a text, and I have commas. a,b,c';
            expect(decode(encode(str))).toEqual(str);
            expect(encode(str)).toStrictEqual(result[str]);
            expect(isWithinTokenLimit(str, result[str].length - 1)).toBe(false);
            expect(isWithinTokenLimit(str, 300)).toBe(result[str].length);
        });
    });
    describe('test plan', () => {
        testPlans[encodingName].forEach(({ sample, encoded }) => {
            it(`encodes ${sample}`, () => {
                expect(encode(sample)).toEqual(encoded);
            });
            it(`decodes ${sample}`, () => {
                expect(decode(encoded)).toEqual(sample);
            });
        });
    });
});
const chatModelNames = Object.keys(mapping_js_1.chatModelParams);
const exampleMessages = [
    {
        role: 'system',
        content: 'You are a helpful, pattern-following assistant that translates corporate jargon into plain English.',
    },
    {
        role: 'system',
        name: 'example_user',
        content: 'New synergies will help drive top-line growth.',
    },
    {
        role: 'system',
        name: 'example_assistant',
        content: 'Things working well together will increase revenue.',
    },
    {
        role: 'system',
        name: 'example_user',
        content: "Let's circle back when we have more bandwidth to touch base on opportunities for increased leverage.",
    },
    {
        role: 'system',
        name: 'example_assistant',
        content: "Let's talk later when we're less busy about how to do better.",
    },
    {
        role: 'user',
        content: "This late pivot means we don't have time to boil the ocean for the client deliverable.",
    },
];
describe.each(chatModelNames)('%s', (modelName) => {
    const encoding = GptEncoding_js_1.GptEncoding.getEncodingApiForModel(modelName, resolveEncoding_js_1.resolveEncoding);
    const expectedEncodedLength = modelName.startsWith('gpt-3.5-turbo')
        ? 127
        : modelName.startsWith('gpt-4o')
            ? 120
            : 121;
    describe('chat functionality', () => {
        it('encodes a chat correctly', () => {
            const encoded = encoding.encodeChat(exampleMessages);
            expect(encoded).toMatchSnapshot();
            expect(encoded).toHaveLength(expectedEncodedLength);
            const decoded = encoding.decode(encoded);
            expect(decoded).toMatchSnapshot();
        });
        it('isWithinTokenLimit: false', () => {
            const isWithinTokenLimit = encoding.isWithinTokenLimit(exampleMessages, 50);
            expect(isWithinTokenLimit).toBe(false);
        });
        it('isWithinTokenLimit: true (number)', () => {
            const isWithinTokenLimit = encoding.isWithinTokenLimit(exampleMessages, 150);
            expect(isWithinTokenLimit).toBe(expectedEncodedLength);
        });
    });
});
function loadTestPlans() {
    const testPlanPath = path_1.default.join(__dirname, '../data/TestPlans.txt');
    const testPlanData = fs_1.default.readFileSync(testPlanPath, 'utf8');
    const tests = {
        cl100k_base: [],
        p50k_base: [],
        p50k_edit: [],
        r50k_base: [],
        o200k_base: [],
    };
    testPlanData.split('\n\n').forEach((testPlan) => {
        const [encodingNameLine, sampleLine, encodedLine] = testPlan.split('\n');
        if (!encodingNameLine || !sampleLine || !encodedLine)
            return;
        const encodingName = encodingNameLine.split(': ')[1];
        tests[encodingName].push({
            sample: sampleLine.split(': ').slice(1).join(': ') ?? '',
            encoded: JSON.parse(encodedLine.split(': ')[1] ?? '[]'),
        });
    });
    return tests;
}
//# sourceMappingURL=GptEncoding.test.js.map