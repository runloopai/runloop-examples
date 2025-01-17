"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GptEncoding_js_1 = require("./GptEncoding.js");
const resolveEncoding_js_1 = require("./resolveEncoding.js");
const sampleText = 'This is a test message.';
const sampleChat = [
    {
        role: 'system',
        content: 'You are a helpful assistant.',
    },
    {
        role: 'user',
        content: 'Hello, how are you?',
    },
    {
        role: 'assistant',
        content: 'I am doing well, thank you for asking.',
    },
];
describe('countTokens', () => {
    const encoding = GptEncoding_js_1.GptEncoding.getEncodingApiForModel('gpt-3.5-turbo', resolveEncoding_js_1.resolveEncoding);
    describe('text input', () => {
        it('counts tokens in empty string', () => {
            expect(encoding.countTokens('')).toBe(0);
        });
        it('counts tokens in simple text', () => {
            expect(encoding.countTokens(sampleText)).toBe(encoding.encode(sampleText).length);
        });
        it('counts tokens in text with special characters', () => {
            const textWithSpecial = 'Hello 👋 world! 🌍';
            expect(encoding.countTokens(textWithSpecial)).toBe(encoding.encode(textWithSpecial).length);
        });
    });
    describe('chat input', () => {
        it('counts tokens in empty chat', () => {
            expect(encoding.countTokens([])).toBe(3); // Due to assistant prompt tokens
        });
        it('counts tokens in sample chat', () => {
            expect(encoding.countTokens(sampleChat)).toBe(encoding.encodeChat(sampleChat).length);
        });
        it('matches token counts from encode methods', () => {
            const tokens = encoding.encodeChat(sampleChat);
            const count = encoding.countTokens(sampleChat);
            expect(count).toBe(tokens.length);
        });
        it('counts tokens in single message chat', () => {
            const singleMessage = [
                {
                    role: 'user',
                    content: 'Hello world',
                },
            ];
            expect(encoding.countTokens(singleMessage)).toBe(encoding.encodeChat(singleMessage).length);
        });
    });
});
//# sourceMappingURL=extraApis.test.js.map