import { streamConverter, extractText } from '../../utils/dist/index.js';

class BaseLLM {
    async complete(params) {
        const { prompt, stream } = params;
        if (stream) {
            const stream = await this.chat({
                messages: [
                    {
                        content: prompt,
                        role: "user"
                    }
                ],
                stream: true
            });
            return streamConverter(stream, (chunk)=>{
                return {
                    raw: null,
                    text: chunk.delta
                };
            });
        }
        const chatResponse = await this.chat({
            messages: [
                {
                    content: prompt,
                    role: "user"
                }
            ]
        });
        return {
            text: extractText(chatResponse.message.content),
            raw: chatResponse.raw
        };
    }
}
class ToolCallLLM extends BaseLLM {
}

export { BaseLLM, ToolCallLLM };
