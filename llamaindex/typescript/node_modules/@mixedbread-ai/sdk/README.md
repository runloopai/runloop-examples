# mixedbread ai TypeScript SDK

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Embeddings](#embeddings)
  - [Reranking](#reranking)
- [Error Handling](#error-handling)
- [API Documentation](#api-documentation)

## Installation

To start using the mixedbread ai SDK in your project, install it via npm (Node Package Manager). Ensure Node.js is installed in your environment beforehand. Run the following command in your project directory to install the SDK:

```bash
npm install @mixedbread-ai/sdk --save
```

## Quick Start
Here's a minimal example to get started with the mixedbread ai SDK:
```typescript
import { MixedbreadAIClient } from "@mixedbread-ai/sdk";

const mxbai = new MixedbreadAIClient({
    apiKey: "{YOUR_API_KEY}"
});

const embeddings = await mxbai.embeddings({
    input: "Hello world!",
    model: "mixedbread-ai/mxbai-embed-large-v1"
});

console.log(embeddings);
```

## Usage

### Embeddings
Here's an example of using the mixedbread ai SDK to create basic embeddings:
```typescript
import { MixedbreadAIClient } from "@mixedbread-ai/sdk";

const mxbai = new MixedbreadAIClient({
    apiKey: "{YOUR_API_KEY}"
});

const embeddings = await mxbai.embeddings({
    model: "mixedbread-ai/mxbai-embed-large-v1",
    input: ["I like to eat apples.", "I like to eat bananas."]
});

console.log(embeddings);
```

By providing a prompt, you can guide the model to produce embeddings that are optimized for your specific use-case or downstream task.

```typescript
import { MixedbreadAIClient } from "@mixedbread-ai/sdk";

const mxbai = new MixedbreadAIClient({
    apiKey: "{YOUR_API_KEY}"
});

const embeddings = await mxbai.embeddings({
    model: "mixedbread-ai/mxbai-embed-large-v1",
    input: ["I like to eat apples.", "I like to eat bananas."],
    prompt: "Represent this sentence for searching relevant passages:"
});

console.log(embeddings);
```

### Reranking
Here's an example of using the mixedbread ai SDK to rerank documents:
```typescript
import { MixedbreadAIClient } from "@mixedbread-ai/sdk";

const mxbai = new MixedbreadAIClient({
    apiKey: "{YOUR_API_KEY}"
});

const model = "mixedbread-ai/mxbai-rerank-large-v1";
const query = "Who wrote 'To Kill a Mockingbird'?";

const documents = [
    "'To Kill a Mockingbird' is a novel by Harper Lee published in 1960. It was immediately successful, winning the Pulitzer Prize, and has become a classic of modern American literature.",
    "The novel 'Moby-Dick' was written by Herman Melville and first published in 1851. It is considered a masterpiece of American literature and deals with complex themes of obsession, revenge, and the conflict between good and evil.",
    "Harper Lee, an American novelist widely known for her novel 'To Kill a Mockingbird', was born in 1926 in Monroeville, Alabama. She received the Pulitzer Prize for Fiction in 1961.",
    "Jane Austen was an English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.",
    "The 'Harry Potter' series, which consists of seven fantasy novels written by British author J.K. Rowling, is among the most popular and critically acclaimed books of the modern era.",
    "'The Great Gatsby', a novel written by American author F. Scott Fitzgerald, was published in 1925. The story is set in the Jazz Age and follows the life of millionaire Jay Gatsby and his pursuit of Daisy Buchanan."
];

const rerankedDocs = await mxbai.reranking({
    model,
    query,
    input: documents
});

console.log(rerankedDocs);
```

Replace `"{YOUR_API_KEY}"` with your actual API key. If you don't have an API key, you can get one for free by signing up for an account at [mixedbread.ai](https://mixedbread.ai/).

## Error Handling and Retries
The SDK will throw an error if there is an issue with the API request, such as an invalid API key or a network error. Make sure to handle these errors in your code using try/catch blocks or `.catch()` on promises.

a subclass of [FernError](./src/errors/MxbaiApiError.ts)
will be thrown:

```ts
import { MxbaiApiError } from "@mixedbread-ai/sdk";

try {
  await mxbai.embeddings({
    model: "mixedbread-ai/mxbai-embed-large-v1",
    input: ["I like to eat apples.", "I like to eat bananas."]
  }, {
    maxRetries: 3,
  });
} catch (err) {
  if (err instanceof MxbaiApiError) {
    console.log(err.statusCode); 
    console.log(err.message);
    console.log(err.body); 
  }
}
```
## API Documentation
For more information on the available methods and options in the mixedbread ai SDK, please refer to our [API documentation](https://mixedbread.ai/api-reference).