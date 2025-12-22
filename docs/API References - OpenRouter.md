---

## 

## '[https://openrouter.ai/docs/api/reference/responses/overview](https://openrouter.ai/docs/api/reference/responses/overview)' 'og:site\_name': OpenRouter Documentation 'og:title': OpenRouter Responses API Beta \- OpenAI-Compatible Documentation 'og:description': \>- Beta version of OpenRouter's OpenAI-compatible Responses API. Stateless transformation layer with support for reasoning, tool calling, and web search. 'og:image': type: url value: \>- [https://openrouter.ai/dynamic-og?title=Responses%20API%20Beta\&description=OpenAI-compatible%20stateless%20API](https://openrouter.ai/dynamic-og?title=Responses%20API%20Beta&description=OpenAI-compatible%20stateless%20API) 'og:image:width': 1200 'og:image:height': 630 'twitter:card': summary\_large\_image 'twitter:site': '@OpenRouterAI' noindex: false nofollow: false

This API is in \*\*beta stage\*\* and may have breaking changes. Use with caution in production environments. This API is \*\*stateless\*\* \- each request is independent and no conversation state is persisted between requests. You must include the full conversation history in each request. OpenRouter's Responses API Beta provides OpenAI-compatible access to multiple AI models through a unified interface, designed to be a drop-in replacement for OpenAI's Responses API. This stateless API offers enhanced capabilities including reasoning, tool calling, and web search integration, with each request being independent and no server-side state persisted.

## Base URL

https://openrouter.ai/api/v1/responses

## Authentication

All requests require authentication using your OpenRouter API key:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: 'Hello, world\!',

  }),

});

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': 'Hello, world\!',

    }

)

curl \-X POST https://openrouter.ai/api/v1/responses \\

  \-H "Authorization: Bearer YOUR\_OPENROUTER\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "model": "openai/o4-mini",

    "input": "Hello, world\!"

  }'

## Core Features

### [Basic Usage](http://./basic-usage)

Learn the fundamentals of making requests with simple text input and handling responses.

### [Reasoning](http://./reasoning)

Access advanced reasoning capabilities with configurable effort levels and encrypted reasoning chains.

### [Tool Calling](http://./tool-calling)

Integrate function calling with support for parallel execution and complex tool interactions.

### [Web Search](http://./web-search)

Enable web search capabilities with real-time information retrieval and citation annotations.

## Error Handling

The API returns structured error responses:

{

  "error": {

    "code": "invalid\_prompt",

    "message": "Missing required parameter: 'model'."

  },

  "metadata": null

}

For comprehensive error handling guidance, see [Error Handling](http://./error-handling).

## Rate Limits

Standard OpenRouter rate limits apply. See [API Limits](http:///docs/api-reference/limits) for details.

---

## title: Basic Usage subtitle: Getting started with the Responses API Beta headline: Responses API Beta Basic Usage | Simple Text Requests canonical-url: '[https://openrouter.ai/docs/api/reference/responses/basic-usage](https://openrouter.ai/docs/api/reference/responses/basic-usage)' 'og:site\_name': OpenRouter Documentation 'og:title': Responses API Beta Basic Usage \- Simple Text Requests 'og:description': \>- Learn the basics of OpenRouter's Responses API Beta with simple text input examples and response handling. 'og:image': type: url value: \>- [https://openrouter.ai/dynamic-og?title=Responses%20API%20Basic%20Usage\&description=Simple%20text%20requests%20and%20responses](https://openrouter.ai/dynamic-og?title=Responses%20API%20Basic%20Usage&description=Simple%20text%20requests%20and%20responses) 'og:image:width': 1200 'og:image:height': 630 'twitter:card': summary\_large\_image 'twitter:site': '@OpenRouterAI' noindex: false nofollow: false

This API is in \*\*beta stage\*\* and may have breaking changes. The Responses API Beta supports both simple string input and structured message arrays, making it easy to get started with basic text generation.

## Simple String Input

The simplest way to use the API is with a string input:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: 'What is the meaning of life?',

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': 'What is the meaning of life?',

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

curl \-X POST https://openrouter.ai/api/v1/responses \\

  \-H "Authorization: Bearer YOUR\_OPENROUTER\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "model": "openai/o4-mini",

    "input": "What is the meaning of life?",

    "max\_output\_tokens": 9000

  }'

## Structured Message Input

For more complex conversations, use the message array format:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Tell me a joke about programming',

          },

        \],

      },

    \],

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Tell me a joke about programming',

                    },

                \],

            },

        \],

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

curl \-X POST https://openrouter.ai/api/v1/responses \\

  \-H "Authorization: Bearer YOUR\_OPENROUTER\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "model": "openai/o4-mini",

    "input": \[

      {

        "type": "message",

        "role": "user",

        "content": \[

          {

            "type": "input\_text",

            "text": "Tell me a joke about programming"

          }

        \]

      }

    \],

    "max\_output\_tokens": 9000

  }'

## Response Format

The API returns a structured response with the generated content:

{

  "id": "resp\_1234567890",

  "object": "response",

  "created\_at": 1234567890,

  "model": "openai/o4-mini",

  "output": \[

    {

      "type": "message",

      "id": "msg\_abc123",

      "status": "completed",

      "role": "assistant",

      "content": \[

        {

          "type": "output\_text",

          "text": "The meaning of life is a philosophical question that has been pondered for centuries...",

          "annotations": \[\]

        }

      \]

    }

  \],

  "usage": {

    "input\_tokens": 12,

    "output\_tokens": 45,

    "total\_tokens": 57

  },

  "status": "completed"

}

## Streaming Responses

Enable streaming for real-time response generation:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: 'Write a short story about AI',

    stream: true,

    max\_output\_tokens: 9000,

  }),

});

const reader \= response.body?.getReader();

const decoder \= new TextDecoder();

while (true) {

  const { done, value } \= await reader.read();

  if (done) break;

  const chunk \= decoder.decode(value);

  const lines \= chunk.split('\\n');

  for (const line of lines) {

    if (line.startsWith('data: ')) {

      const data \= line.slice(6);

      if (data \=== '\[DONE\]') return;

      try {

        const parsed \= JSON.parse(data);

        console.log(parsed);

      } catch (e) {

        // Skip invalid JSON

      }

    }

  }

}

import requests

import json

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': 'Write a short story about AI',

        'stream': True,

        'max\_output\_tokens': 9000,

    },

    stream=True

)

for line in response.iter\_lines():

    if line:

        line\_str \= line.decode('utf-8')

        if line\_str.startswith('data: '):

            data \= line\_str\[6:\]

            if data \== '\[DONE\]':

                break

            try:

                parsed \= json.loads(data)

                print(parsed)

            except json.JSONDecodeError:

                continue

### Example Streaming Output

The streaming response returns Server-Sent Events (SSE) chunks:

data: {"type":"response.created","response":{"id":"resp\_1234567890","object":"response","status":"in\_progress"}}

data: {"type":"response.output\_item.added","response\_id":"resp\_1234567890","output\_index":0,"item":{"type":"message","id":"msg\_abc123","role":"assistant","status":"in\_progress","content":\[\]}}

data: {"type":"response.content\_part.added","response\_id":"resp\_1234567890","output\_index":0,"content\_index":0,"part":{"type":"output\_text","text":""}}

data: {"type":"response.content\_part.delta","response\_id":"resp\_1234567890","output\_index":0,"content\_index":0,"delta":"Once"}

data: {"type":"response.content\_part.delta","response\_id":"resp\_1234567890","output\_index":0,"content\_index":0,"delta":" upon"}

data: {"type":"response.content\_part.delta","response\_id":"resp\_1234567890","output\_index":0,"content\_index":0,"delta":" a"}

data: {"type":"response.content\_part.delta","response\_id":"resp\_1234567890","output\_index":0,"content\_index":0,"delta":" time"}

data: {"type":"response.output\_item.done","response\_id":"resp\_1234567890","output\_index":0,"item":{"type":"message","id":"msg\_abc123","role":"assistant","status":"completed","content":\[{"type":"output\_text","text":"Once upon a time, in a world where artificial intelligence had become as common as smartphones..."}\]}}

data: {"type":"response.done","response":{"id":"resp\_1234567890","object":"response","status":"completed","usage":{"input\_tokens":12,"output\_tokens":45,"total\_tokens":57}}}

data: \[DONE\]

## Common Parameters

| Parameter | Type | Description |
| :---- | :---- | :---- |
| `model` | string | **Required.** Model to use (e.g., `openai/o4-mini`) |
| `input` | string or array | **Required.** Text or message array |
| `stream` | boolean | Enable streaming responses (default: false) |
| `max_output_tokens` | integer | Maximum tokens to generate |
| `temperature` | number | Sampling temperature (0-2) |
| `top_p` | number | Nucleus sampling parameter (0-1) |

## Error Handling

Handle common errors gracefully:

try {

  const response \= await fetch('https://openrouter.ai/api/v1/responses', {

    method: 'POST',

    headers: {

      'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

      'Content-Type': 'application/json',

    },

    body: JSON.stringify({

      model: 'openai/o4-mini',

      input: 'Hello, world\!',

    }),

  });

  if (\!response.ok) {

    const error \= await response.json();

    console.error('API Error:', error.error.message);

    return;

  }

  const result \= await response.json();

  console.log(result);

} catch (error) {

  console.error('Network Error:', error);

}

import requests

try:

    response \= requests.post(

        'https://openrouter.ai/api/v1/responses',

        headers={

            'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

            'Content-Type': 'application/json',

        },

        json={

            'model': 'openai/o4-mini',

            'input': 'Hello, world\!',

        }

    )

    if response.status\_code \!= 200:

        error \= response.json()

        print(f"API Error: {error\['error'\]\['message'\]}")

    else:

        result \= response.json()

        print(result)

except requests.RequestException as e:

    print(f"Network Error: {e}")

## Multiple Turn Conversations

Since the Responses API Beta is stateless, you must include the full conversation history in each request to maintain context:

// First request

const firstResponse \= await fetch('https://openrouter.ai/api/beta/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the capital of France?',

          },

        \],

      },

    \],

    max\_output\_tokens: 9000,

  }),

});

const firstResult \= await firstResponse.json();

// Second request \- include previous conversation

const secondResponse \= await fetch('https://openrouter.ai/api/beta/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the capital of France?',

          },

        \],

      },

      {

        type: 'message',

        role: 'assistant',

        id: 'msg\_abc123',

        status: 'completed',

        content: \[

          {

            type: 'output\_text',

            text: 'The capital of France is Paris.',

            annotations: \[\]

          }

        \]

      },

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the population of that city?',

          },

        \],

      },

    \],

    max\_output\_tokens: 9000,

  }),

});

const secondResult \= await secondResponse.json();

import requests

\# First request

first\_response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the capital of France?',

                    },

                \],

            },

        \],

        'max\_output\_tokens': 9000,

    }

)

first\_result \= first\_response.json()

\# Second request \- include previous conversation

second\_response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the capital of France?',

                    },

                \],

            },

            {

                'type': 'message',

                'role': 'assistant',

                'id': 'msg\_abc123',

                'status': 'completed',

                'content': \[

                    {

                        'type': 'output\_text',

                        'text': 'The capital of France is Paris.',

                        'annotations': \[\]

                    }

                \]

            },

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the population of that city?',

                    },

                \],

            },

        \],

        'max\_output\_tokens': 9000,

    }

)

second\_result \= second\_response.json()

## The \`id\` and \`status\` fields are required for any \`assistant\` role messages included in the conversation history. Always include the complete conversation history in each request. The API does not store previous messages, so context must be maintained client-side. Next Steps

- Learn about [Reasoning](http://./reasoning) capabilities  
- Explore [Tool Calling](http://./tool-calling) functionality  
- Try [Web Search](http://./web-search) integration

---

## title: Reasoning subtitle: Advanced reasoning capabilities with the Responses API Beta headline: Responses API Beta Reasoning | Advanced AI Reasoning Capabilities canonical-url: '[https://openrouter.ai/docs/api/reference/responses/reasoning](https://openrouter.ai/docs/api/reference/responses/reasoning)' 'og:site\_name': OpenRouter Documentation 'og:title': Responses API Beta Reasoning \- Advanced AI Reasoning 'og:description': \>- Access advanced reasoning capabilities with configurable effort levels and encrypted reasoning chains using OpenRouter's Responses API Beta. 'og:image': type: url value: \>- [https://openrouter.ai/dynamic-og?title=Responses%20API%20Reasoning\&description=Advanced%20AI%20reasoning%20capabilities](https://openrouter.ai/dynamic-og?title=Responses%20API%20Reasoning&description=Advanced%20AI%20reasoning%20capabilities) 'og:image:width': 1200 'og:image:height': 630 'twitter:card': summary\_large\_image 'twitter:site': '@OpenRouterAI' noindex: false nofollow: false

This API is in \*\*beta stage\*\* and may have breaking changes. The Responses API Beta supports advanced reasoning capabilities, allowing models to show their internal reasoning process with configurable effort levels.

## Reasoning Configuration

Configure reasoning behavior using the `reasoning` parameter:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: 'What is the meaning of life?',

    reasoning: {

      effort: 'high'

    },

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': 'What is the meaning of life?',

        'reasoning': {

            'effort': 'high'

        },

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

curl \-X POST https://openrouter.ai/api/v1/responses \\

  \-H "Authorization: Bearer YOUR\_OPENROUTER\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "model": "openai/o4-mini",

    "input": "What is the meaning of life?",

    "reasoning": {

      "effort": "high"

    },

    "max\_output\_tokens": 9000

  }'

## Reasoning Effort Levels

The `effort` parameter controls how much computational effort the model puts into reasoning:

| Effort Level | Description |
| :---- | :---- |
| `minimal` | Basic reasoning with minimal computational effort |
| `low` | Light reasoning for simple problems |
| `medium` | Balanced reasoning for moderate complexity |
| `high` | Deep reasoning for complex problems |

## Complex Reasoning Example

For complex mathematical or logical problems:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Was 1995 30 years ago? Please show your reasoning.',

          },

        \],

      },

    \],

    reasoning: {

      effort: 'high'

    },

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Was 1995 30 years ago? Please show your reasoning.',

                    },

                \],

            },

        \],

        'reasoning': {

            'effort': 'high'

        },

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Reasoning in Conversation Context

Include reasoning in multi-turn conversations:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is your favorite color?',

          },

        \],

      },

      {

        type: 'message',

        role: 'assistant',

        id: 'msg\_abc123',

        status: 'completed',

        content: \[

          {

            type: 'output\_text',

            text: "I don't have a favorite color.",

            annotations: \[\]

          }

        \]

      },

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'How many Earths can fit on Mars?',

          },

        \],

      },

    \],

    reasoning: {

      effort: 'high'

    },

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is your favorite color?',

                    },

                \],

            },

            {

                'type': 'message',

                'role': 'assistant',

                'id': 'msg\_abc123',

                'status': 'completed',

                'content': \[

                    {

                        'type': 'output\_text',

                        'text': "I don't have a favorite color.",

                        'annotations': \[\]

                    }

                \]

            },

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'How many Earths can fit on Mars?',

                    },

                \],

            },

        \],

        'reasoning': {

            'effort': 'high'

        },

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Streaming Reasoning

Enable streaming to see reasoning develop in real-time:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: 'Solve this step by step: If a train travels 60 mph for 2.5 hours, how far does it go?',

    reasoning: {

      effort: 'medium'

    },

    stream: true,

    max\_output\_tokens: 9000,

  }),

});

const reader \= response.body?.getReader();

const decoder \= new TextDecoder();

while (true) {

  const { done, value } \= await reader.read();

  if (done) break;

  const chunk \= decoder.decode(value);

  const lines \= chunk.split('\\n');

  for (const line of lines) {

    if (line.startsWith('data: ')) {

      const data \= line.slice(6);

      if (data \=== '\[DONE\]') return;

      try {

        const parsed \= JSON.parse(data);

        if (parsed.type \=== 'response.reasoning.delta') {

          console.log('Reasoning:', parsed.delta);

        }

      } catch (e) {

        // Skip invalid JSON

      }

    }

  }

}

import requests

import json

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': 'Solve this step by step: If a train travels 60 mph for 2.5 hours, how far does it go?',

        'reasoning': {

            'effort': 'medium'

        },

        'stream': True,

        'max\_output\_tokens': 9000,

    },

    stream=True

)

for line in response.iter\_lines():

    if line:

        line\_str \= line.decode('utf-8')

        if line\_str.startswith('data: '):

            data \= line\_str\[6:\]

            if data \== '\[DONE\]':

                break

            try:

                parsed \= json.loads(data)

                if parsed.get('type') \== 'response.reasoning.delta':

                    print(f"Reasoning: {parsed.get('delta', '')}")

            except json.JSONDecodeError:

                continue

## Response with Reasoning

When reasoning is enabled, the response includes reasoning information:

{

  "id": "resp\_1234567890",

  "object": "response",

  "created\_at": 1234567890,

  "model": "openai/o4-mini",

  "output": \[

    {

      "type": "reasoning",

      "id": "rs\_abc123",

      "encrypted\_content": "gAAAAABotI9-FK1PbhZhaZk4yMrZw3XDI1AWFaKb9T0NQq7LndK6zaRB...",

      "summary": \[

        "First, I need to determine the current year",

        "Then calculate the difference from 1995",

        "Finally, compare that to 30 years"

      \]

    },

    {

      "type": "message",

      "id": "msg\_xyz789",

      "status": "completed",

      "role": "assistant",

      "content": \[

        {

          "type": "output\_text",

          "text": "Yes. In 2025, 1995 was 30 years ago. In fact, as of today (Aug 31, 2025), it's exactly 30 years since Aug 31, 1995.",

          "annotations": \[\]

        }

      \]

    }

  \],

  "usage": {

    "input\_tokens": 15,

    "output\_tokens": 85,

    "output\_tokens\_details": {

      "reasoning\_tokens": 45

    },

    "total\_tokens": 100

  },

  "status": "completed"

}

## Best Practices

1. **Choose appropriate effort levels**: Use `high` for complex problems, `low` for simple tasks  
2. **Consider token usage**: Reasoning increases token consumption  
3. **Use streaming**: For long reasoning chains, streaming provides better user experience  
4. **Include context**: Provide sufficient context for the model to reason effectively

## Next Steps

- Explore [Tool Calling](http://./tool-calling) with reasoning  
- Learn about [Web Search](http://./web-search) integration  
- Review [Basic Usage](http://./basic-usage) fundamentals

 

---

## title: Tool Calling subtitle: Function calling and tool integration with the Responses API Beta headline: Responses API Beta Tool Calling | Function Calling Integration canonical-url: '[https://openrouter.ai/docs/api/reference/responses/tool-calling](https://openrouter.ai/docs/api/reference/responses/tool-calling)' 'og:site\_name': OpenRouter Documentation 'og:title': Responses API Beta Tool Calling \- Function Calling Integration 'og:description': \>- Integrate function calling with support for parallel execution and complex tool interactions using OpenRouter's Responses API Beta. 'og:image': type: url value: \>- [https://openrouter.ai/dynamic-og?title=Responses%20API%20Tool%20Calling\&description=Function%20calling%20integration](https://openrouter.ai/dynamic-og?title=Responses%20API%20Tool%20Calling&description=Function%20calling%20integration) 'og:image:width': 1200 'og:image:height': 630 'twitter:card': summary\_large\_image 'twitter:site': '@OpenRouterAI' noindex: false nofollow: false

This API is in \*\*beta stage\*\* and may have breaking changes. The Responses API Beta supports comprehensive tool calling capabilities, allowing models to call functions, execute tools in parallel, and handle complex multi-step workflows.

## Basic Tool Definition

Define tools using the OpenAI function calling format:

const weatherTool \= {

  type: 'function' as const,

  name: 'get\_weather',

  description: 'Get the current weather in a location',

  strict: null,

  parameters: {

    type: 'object',

    properties: {

      location: {

        type: 'string',

        description: 'The city and state, e.g. San Francisco, CA',

      },

      unit: {

        type: 'string',

        enum: \['celsius', 'fahrenheit'\],

      },

    },

    required: \['location'\],

  },

};

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the weather in San Francisco?',

          },

        \],

      },

    \],

    tools: \[weatherTool\],

    tool\_choice: 'auto',

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

weather\_tool \= {

    'type': 'function',

    'name': 'get\_weather',

    'description': 'Get the current weather in a location',

    'strict': None,

    'parameters': {

        'type': 'object',

        'properties': {

            'location': {

                'type': 'string',

                'description': 'The city and state, e.g. San Francisco, CA',

            },

            'unit': {

                'type': 'string',

                'enum': \['celsius', 'fahrenheit'\],

            },

        },

        'required': \['location'\],

    },

}

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the weather in San Francisco?',

                    },

                \],

            },

        \],

        'tools': \[weather\_tool\],

        'tool\_choice': 'auto',

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

curl \-X POST https://openrouter.ai/api/v1/responses \\

  \-H "Authorization: Bearer YOUR\_OPENROUTER\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "model": "openai/o4-mini",

    "input": \[

      {

        "type": "message",

        "role": "user",

        "content": \[

          {

            "type": "input\_text",

            "text": "What is the weather in San Francisco?"

          }

        \]

      }

    \],

    "tools": \[

      {

        "type": "function",

        "name": "get\_weather",

        "description": "Get the current weather in a location",

        "strict": null,

        "parameters": {

          "type": "object",

          "properties": {

            "location": {

              "type": "string",

              "description": "The city and state, e.g. San Francisco, CA"

            },

            "unit": {

              "type": "string",

              "enum": \["celsius", "fahrenheit"\]

            }

          },

          "required": \["location"\]

        }

      }

    \],

    "tool\_choice": "auto",

    "max\_output\_tokens": 9000

  }'

## Tool Choice Options

Control when and how tools are called:

| Tool Choice | Description |
| :---- | :---- |
| `auto` | Model decides whether to call tools |
| `none` | Model will not call any tools |
| `{type: 'function', name: 'tool_name'}` | Force specific tool call |

### Force Specific Tool

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Hello, how are you?',

          },

        \],

      },

    \],

    tools: \[weatherTool\],

    tool\_choice: { type: 'function', name: 'get\_weather' },

    max\_output\_tokens: 9000,

  }),

});

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Hello, how are you?',

                    },

                \],

            },

        \],

        'tools': \[weather\_tool\],

        'tool\_choice': {'type': 'function', 'name': 'get\_weather'},

        'max\_output\_tokens': 9000,

    }

)

### Disable Tool Calling

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the weather in Paris?',

          },

        \],

      },

    \],

    tools: \[weatherTool\],

    tool\_choice: 'none',

    max\_output\_tokens: 9000,

  }),

});

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the weather in Paris?',

                    },

                \],

            },

        \],

        'tools': \[weather\_tool\],

        'tool\_choice': 'none',

        'max\_output\_tokens': 9000,

    }

)

## Multiple Tools

Define multiple tools for complex workflows:

const calculatorTool \= {

  type: 'function' as const,

  name: 'calculate',

  description: 'Perform mathematical calculations',

  strict: null,

  parameters: {

    type: 'object',

    properties: {

      expression: {

        type: 'string',

        description: 'The mathematical expression to evaluate',

      },

    },

    required: \['expression'\],

  },

};

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is 25 \* 4?',

          },

        \],

      },

    \],

    tools: \[weatherTool, calculatorTool\],

    tool\_choice: 'auto',

    max\_output\_tokens: 9000,

  }),

});

calculator\_tool \= {

    'type': 'function',

    'name': 'calculate',

    'description': 'Perform mathematical calculations',

    'strict': None,

    'parameters': {

        'type': 'object',

        'properties': {

            'expression': {

                'type': 'string',

                'description': 'The mathematical expression to evaluate',

            },

        },

        'required': \['expression'\],

    },

}

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is 25 \* 4?',

                    },

                \],

            },

        \],

        'tools': \[weather\_tool, calculator\_tool\],

        'tool\_choice': 'auto',

        'max\_output\_tokens': 9000,

    }

)

## Parallel Tool Calls

The API supports parallel execution of multiple tools:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Calculate 10\*5 and also tell me the weather in Miami',

          },

        \],

      },

    \],

    tools: \[weatherTool, calculatorTool\],

    tool\_choice: 'auto',

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Calculate 10\*5 and also tell me the weather in Miami',

                    },

                \],

            },

        \],

        'tools': \[weather\_tool, calculator\_tool\],

        'tool\_choice': 'auto',

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Tool Call Response

When tools are called, the response includes function call information:

{

  "id": "resp\_1234567890",

  "object": "response",

  "created\_at": 1234567890,

  "model": "openai/o4-mini",

  "output": \[

    {

      "type": "function\_call",

      "id": "fc\_abc123",

      "call\_id": "call\_xyz789",

      "name": "get\_weather",

      "arguments": "{\\"location\\":\\"San Francisco, CA\\"}"

    }

  \],

  "usage": {

    "input\_tokens": 45,

    "output\_tokens": 25,

    "total\_tokens": 70

  },

  "status": "completed"

}

## Tool Responses in Conversation

Include tool responses in follow-up requests:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the weather in Boston?',

          },

        \],

      },

      {

        type: 'function\_call',

        id: 'fc\_1',

        call\_id: 'call\_123',

        name: 'get\_weather',

        arguments: JSON.stringify({ location: 'Boston, MA' }),

      },

      {

        type: 'function\_call\_output',

        id: 'fc\_output\_1',

        call\_id: 'call\_123',

        output: JSON.stringify({ temperature: '72°F', condition: 'Sunny' }),

      },

      {

        type: 'message',

        role: 'assistant',

        id: 'msg\_abc123',

        status: 'completed',

        content: \[

          {

            type: 'output\_text',

            text: 'The weather in Boston is currently 72°F and sunny. This looks like perfect weather for a picnic\!',

            annotations: \[\]

          }

        \]

      },

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Is that good weather for a picnic?',

          },

        \],

      },

    \],

    max\_output\_tokens: 9000,

  }),

});

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the weather in Boston?',

                    },

                \],

            },

            {

                'type': 'function\_call',

                'id': 'fc\_1',

                'call\_id': 'call\_123',

                'name': 'get\_weather',

                'arguments': '{"location": "Boston, MA"}',

            },

            {

                'type': 'function\_call\_output',

                'id': 'fc\_output\_1',

                'call\_id': 'call\_123',

                'output': '{"temperature": "72°F", "condition": "Sunny"}',

            },

            {

                'type': 'message',

                'role': 'assistant',

                'id': 'msg\_abc123',

                'status': 'completed',

                'content': \[

                    {

                        'type': 'output\_text',

                        'text': 'The weather in Boston is currently 72°F and sunny. This looks like perfect weather for a picnic\!',

                        'annotations': \[\]

                    }

                \]

            },

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Is that good weather for a picnic?',

                    },

                \],

            },

        \],

        'max\_output\_tokens': 9000,

    }

)

## The \`id\` field is required for \`function\_call\_output\` objects when including tool responses in conversation history. Streaming Tool Calls

Monitor tool calls in real-time with streaming:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the weather like in Tokyo, Japan? Please check the weather.',

          },

        \],

      },

    \],

    tools: \[weatherTool\],

    tool\_choice: 'auto',

    stream: true,

    max\_output\_tokens: 9000,

  }),

});

const reader \= response.body?.getReader();

const decoder \= new TextDecoder();

while (true) {

  const { done, value } \= await reader.read();

  if (done) break;

  const chunk \= decoder.decode(value);

  const lines \= chunk.split('\\n');

  for (const line of lines) {

    if (line.startsWith('data: ')) {

      const data \= line.slice(6);

      if (data \=== '\[DONE\]') return;

      try {

        const parsed \= JSON.parse(data);

        if (parsed.type \=== 'response.output\_item.added' &&

            parsed.item?.type \=== 'function\_call') {

          console.log('Function call:', parsed.item.name);

        }

        if (parsed.type \=== 'response.function\_call\_arguments.done') {

          console.log('Arguments:', parsed.arguments);

        }

      } catch (e) {

        // Skip invalid JSON

      }

    }

  }

}

import requests

import json

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the weather like in Tokyo, Japan? Please check the weather.',

                    },

                \],

            },

        \],

        'tools': \[weather\_tool\],

        'tool\_choice': 'auto',

        'stream': True,

        'max\_output\_tokens': 9000,

    },

    stream=True

)

for line in response.iter\_lines():

    if line:

        line\_str \= line.decode('utf-8')

        if line\_str.startswith('data: '):

            data \= line\_str\[6:\]

            if data \== '\[DONE\]':

                break

            try:

                parsed \= json.loads(data)

                if (parsed.get('type') \== 'response.output\_item.added' and

                    parsed.get('item', {}).get('type') \== 'function\_call'):

                    print(f"Function call: {parsed\['item'\]\['name'\]}")

                if parsed.get('type') \== 'response.function\_call\_arguments.done':

                    print(f"Arguments: {parsed.get('arguments', '')}")

            except json.JSONDecodeError:

                continue

## Tool Validation

Ensure tool calls have proper structure:

{

  "type": "function\_call",

  "id": "fc\_abc123",

  "call\_id": "call\_xyz789",

  "name": "get\_weather",

  "arguments": "{\\"location\\":\\"Seattle, WA\\"}"

}

Required fields:

- `type`: Always "function\_call"  
- `id`: Unique identifier for the function call object  
- `name`: Function name matching tool definition  
- `arguments`: Valid JSON string with function parameters  
- `call_id`: Unique identifier for the call

## Best Practices

1. **Clear descriptions**: Provide detailed function descriptions and parameter explanations  
2. **Proper schemas**: Use valid JSON Schema for parameters  
3. **Error handling**: Handle cases where tools might not be called  
4. **Parallel execution**: Design tools to work independently when possible  
5. **Conversation flow**: Include tool responses in follow-up requests for context

## Next Steps

- Learn about [Web Search](http://./web-search) integration  
- Explore [Reasoning](http://./reasoning) with tools  
- Review [Basic Usage](http://./basic-usage) fundamentals

---

## title: Web Search subtitle: Real-time web search integration with the Responses API Beta headline: Responses API Beta Web Search | Real-time Information Retrieval canonical-url: '[https://openrouter.ai/docs/api/reference/responses/web-search](https://openrouter.ai/docs/api/reference/responses/web-search)' 'og:site\_name': OpenRouter Documentation 'og:title': Responses API Beta Web Search \- Real-time Information Retrieval 'og:description': \>- Enable web search capabilities with real-time information retrieval and citation annotations using OpenRouter's Responses API Beta. 'og:image': type: url value: \>- [https://openrouter.ai/dynamic-og?title=Responses%20API%20Web%20Search\&description=Real-time%20information%20retrieval](https://openrouter.ai/dynamic-og?title=Responses%20API%20Web%20Search&description=Real-time%20information%20retrieval) 'og:image:width': 1200 'og:image:height': 630 'twitter:card': summary\_large\_image 'twitter:site': '@OpenRouterAI' noindex: false nofollow: false

This API is in \*\*beta stage\*\* and may have breaking changes. The Responses API Beta supports web search integration, allowing models to access real-time information from the internet and provide responses with proper citations and annotations.

## Web Search Plugin

Enable web search using the `plugins` parameter:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: 'What is OpenRouter?',

    plugins: \[{ id: 'web', max\_results: 3 }\],

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': 'What is OpenRouter?',

        'plugins': \[{'id': 'web', 'max\_results': 3}\],

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

curl \-X POST https://openrouter.ai/api/v1/responses \\

  \-H "Authorization: Bearer YOUR\_OPENROUTER\_API\_KEY" \\

  \-H "Content-Type: application/json" \\

  \-d '{

    "model": "openai/o4-mini",

    "input": "What is OpenRouter?",

    "plugins": \[{"id": "web", "max\_results": 3}\],

    "max\_output\_tokens": 9000

  }'

## Plugin Configuration

Configure web search behavior:

| Parameter | Type | Description |
| :---- | :---- | :---- |
| `id` | string | **Required.** Must be "web" |
| `max_results` | integer | Maximum search results to retrieve (1-10) |

## Structured Message with Web Search

Use structured messages for more complex queries:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What was a positive news story from today?',

          },

        \],

      },

    \],

    plugins: \[{ id: 'web', max\_results: 2 }\],

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What was a positive news story from today?',

                    },

                \],

            },

        \],

        'plugins': \[{'id': 'web', 'max\_results': 2}\],

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Online Model Variants

Some models have built-in web search capabilities using the `:online` variant:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini:online',

    input: 'What was a positive news story from today?',

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini:online',

        'input': 'What was a positive news story from today?',

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Response with Annotations

Web search responses include citation annotations:

{

  "id": "resp\_1234567890",

  "object": "response",

  "created\_at": 1234567890,

  "model": "openai/o4-mini",

  "output": \[

    {

      "type": "message",

      "id": "msg\_abc123",

      "status": "completed",

      "role": "assistant",

      "content": \[

        {

          "type": "output\_text",

          "text": "OpenRouter is a unified API for accessing multiple Large Language Model providers through a single interface. It allows developers to access 100+ AI models from providers like OpenAI, Anthropic, Google, and others with intelligent routing and automatic failover.",

          "annotations": \[

            {

              "type": "url\_citation",

              "url": "https://openrouter.ai/docs",

              "start\_index": 0,

              "end\_index": 85

            },

            {

              "type": "url\_citation",

              "url": "https://openrouter.ai/models",

              "start\_index": 120,

              "end\_index": 180

            }

          \]

        }

      \]

    }

  \],

  "usage": {

    "input\_tokens": 15,

    "output\_tokens": 95,

    "total\_tokens": 110

  },

  "status": "completed"

}

## Annotation Types

Web search responses can include different annotation types:

### URL Citation

{

  "type": "url\_citation",

  "url": "https://example.com/article",

  "start\_index": 0,

  "end\_index": 50

}

## Complex Search Queries

Handle multi-part search queries:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Compare OpenAI and Anthropic latest models',

          },

        \],

      },

    \],

    plugins: \[{ id: 'web', max\_results: 5 }\],

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Compare OpenAI and Anthropic latest models',

                    },

                \],

            },

        \],

        'plugins': \[{'id': 'web', 'max\_results': 5}\],

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Web Search in Conversation

Include web search in multi-turn conversations:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the latest version of React?',

          },

        \],

      },

      {

        type: 'message',

        id: 'msg\_1',

        status: 'in\_progress',

        role: 'assistant',

        content: \[

          {

            type: 'output\_text',

            text: 'Let me search for the latest React version.',

            annotations: \[\],

          },

        \],

      },

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'Yes, please find the most recent information',

          },

        \],

      },

    \],

    plugins: \[{ id: 'web', max\_results: 2 }\],

    max\_output\_tokens: 9000,

  }),

});

const result \= await response.json();

console.log(result);

import requests

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the latest version of React?',

                    },

                \],

            },

            {

                'type': 'message',

                'id': 'msg\_1',

                'status': 'in\_progress',

                'role': 'assistant',

                'content': \[

                    {

                        'type': 'output\_text',

                        'text': 'Let me search for the latest React version.',

                        'annotations': \[\],

                    },

                \],

            },

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'Yes, please find the most recent information',

                    },

                \],

            },

        \],

        'plugins': \[{'id': 'web', 'max\_results': 2}\],

        'max\_output\_tokens': 9000,

    }

)

result \= response.json()

print(result)

## Streaming Web Search

Monitor web search progress with streaming:

const response \= await fetch('https://openrouter.ai/api/v1/responses', {

  method: 'POST',

  headers: {

    'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: 'openai/o4-mini',

    input: \[

      {

        type: 'message',

        role: 'user',

        content: \[

          {

            type: 'input\_text',

            text: 'What is the latest news about AI?',

          },

        \],

      },

    \],

    plugins: \[{ id: 'web', max\_results: 2 }\],

    stream: true,

    max\_output\_tokens: 9000,

  }),

});

const reader \= response.body?.getReader();

const decoder \= new TextDecoder();

while (true) {

  const { done, value } \= await reader.read();

  if (done) break;

  const chunk \= decoder.decode(value);

  const lines \= chunk.split('\\n');

  for (const line of lines) {

    if (line.startsWith('data: ')) {

      const data \= line.slice(6);

      if (data \=== '\[DONE\]') return;

      try {

        const parsed \= JSON.parse(data);

        if (parsed.type \=== 'response.output\_item.added' &&

            parsed.item?.type \=== 'message') {

          console.log('Message added');

        }

        if (parsed.type \=== 'response.completed') {

          const annotations \= parsed.response?.output

            ?.find(o \=\> o.type \=== 'message')

            ?.content?.find(c \=\> c.type \=== 'output\_text')

            ?.annotations || \[\];

          console.log('Citations:', annotations.length);

        }

      } catch (e) {

        // Skip invalid JSON

      }

    }

  }

}

import requests

import json

response \= requests.post(

    'https://openrouter.ai/api/v1/responses',

    headers={

        'Authorization': 'Bearer YOUR\_OPENROUTER\_API\_KEY',

        'Content-Type': 'application/json',

    },

    json={

        'model': 'openai/o4-mini',

        'input': \[

            {

                'type': 'message',

                'role': 'user',

                'content': \[

                    {

                        'type': 'input\_text',

                        'text': 'What is the latest news about AI?',

                    },

                \],

            },

        \],

        'plugins': \[{'id': 'web', 'max\_results': 2}\],

        'stream': True,

        'max\_output\_tokens': 9000,

    },

    stream=True

)

for line in response.iter\_lines():

    if line:

        line\_str \= line.decode('utf-8')

        if line\_str.startswith('data: '):

            data \= line\_str\[6:\]

            if data \== '\[DONE\]':

                break

            try:

                parsed \= json.loads(data)

                if (parsed.get('type') \== 'response.output\_item.added' and

                    parsed.get('item', {}).get('type') \== 'message'):

                    print('Message added')

                if parsed.get('type') \== 'response.completed':

                    output \= parsed.get('response', {}).get('output', \[\])

                    message \= next((o for o in output if o.get('type') \== 'message'), {})

                    content \= message.get('content', \[\])

                    text\_content \= next((c for c in content if c.get('type') \== 'output\_text'), {})

                    annotations \= text\_content.get('annotations', \[\])

                    print(f'Citations: {len(annotations)}')

            except json.JSONDecodeError:

                continue

## Annotation Processing

Extract and process citation information:

function extractCitations(response: any) {

  const messageOutput \= response.output?.find((o: any) \=\> o.type \=== 'message');

  const textContent \= messageOutput?.content?.find((c: any) \=\> c.type \=== 'output\_text');

  const annotations \= textContent?.annotations || \[\];

  return annotations

    .filter((annotation: any) \=\> annotation.type \=== 'url\_citation')

    .map((annotation: any) \=\> ({

      url: annotation.url,

      text: textContent.text.slice(annotation.start\_index, annotation.end\_index),

      startIndex: annotation.start\_index,

      endIndex: annotation.end\_index,

    }));

}

const result \= await response.json();

const citations \= extractCitations(result);

console.log('Found citations:', citations);

def extract\_citations(response\_data):

    output \= response\_data.get('output', \[\])

    message\_output \= next((o for o in output if o.get('type') \== 'message'), {})

    content \= message\_output.get('content', \[\])

    text\_content \= next((c for c in content if c.get('type') \== 'output\_text'), {})

    annotations \= text\_content.get('annotations', \[\])

    text \= text\_content.get('text', '')

    citations \= \[\]

    for annotation in annotations:

        if annotation.get('type') \== 'url\_citation':

            citations.append({

                'url': annotation.get('url'),

                'text': text\[annotation.get('start\_index', 0):annotation.get('end\_index', 0)\],

                'start\_index': annotation.get('start\_index'),

                'end\_index': annotation.get('end\_index'),

            })

    return citations

result \= response.json()

citations \= extract\_citations(result)

print(f'Found citations: {citations}')

## Best Practices

1. **Limit results**: Use appropriate `max_results` to balance quality and speed  
2. **Handle annotations**: Process citation annotations for proper attribution  
3. **Query specificity**: Make search queries specific for better results  
4. **Error handling**: Handle cases where web search might fail  
5. **Rate limits**: Be mindful of search rate limits

## Next Steps

- Learn about [Tool Calling](http://./tool-calling) integration  
- Explore [Reasoning](http://./reasoning) capabilities  
- Review [Basic Usage](http://./basic-usage) fundamentals

---

## title: Error Handling subtitle: Understanding and handling errors in the Responses API Beta headline: Responses API Beta Error Handling | Basic Error Guide canonical-url: '[https://openrouter.ai/docs/api/reference/responses/error-handling](https://openrouter.ai/docs/api/reference/responses/error-handling)' 'og:site\_name': OpenRouter Documentation 'og:title': Responses API Beta Error Handling \- Basic Error Guide 'og:description': \>- Learn how to handle errors in OpenRouter's Responses API Beta with the basic error response format. 'og:image': type: url value: \>- [https://openrouter.ai/dynamic-og?title=Responses%20API%20Error%20Handling\&description=Basic%20error%20handling%20guide](https://openrouter.ai/dynamic-og?title=Responses%20API%20Error%20Handling&description=Basic%20error%20handling%20guide) 'og:image:width': 1200 'og:image:height': 630 'twitter:card': summary\_large\_image 'twitter:site': '@OpenRouterAI' noindex: false nofollow: false

This API is in \*\*beta stage\*\* and may have breaking changes. Use with caution in production environments. This API is \*\*stateless\*\* \- each request is independent and no conversation state is persisted between requests. You must include the full conversation history in each request. The Responses API Beta returns structured error responses that follow a consistent format.

## Error Response Format

All errors follow this structure:

{

  "error": {

    "code": "invalid\_prompt",

    "message": "Detailed error description"

  },

  "metadata": null

}

### Error Codes

The API uses the following error codes:

| Code | Description | Equivalent HTTP Status |
| :---- | :---- | :---- |
| `invalid_prompt` | Request validation failed | 400 |
| `rate_limit_exceeded` | Too many requests | 429 |
| `server_error` | Internal server error | 500+ |

# API REFERENCE 

# Create a response

POST [https://openrouter.ai/api/v1/responses](https://openrouter.ai/api/v1/responses) Content-Type: application/json

Creates a streaming or non-streaming response using OpenResponses API format

Reference: [https://openrouter.ai/docs/api/api-reference/responses/create-responses](https://openrouter.ai/docs/api/api-reference/responses/create-responses)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: Create a response

  version: endpoint\_betaResponses.createResponses

paths:

  /responses:

    post:

      operationId: create-responses

      summary: Create a response

      description: \>-

        Creates a streaming or non-streaming response using OpenResponses API

        format

      tags:

        \- \- subpackage\_betaResponses

      parameters:

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Successful response

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/OpenResponsesNonStreamingResponse'

        '400':

          description: Bad Request \- Invalid request parameters or malformed input

          content: {}

        '401':

          description: Unauthorized \- Authentication required or invalid credentials

          content: {}

        '402':

          description: Payment Required \- Insufficient credits or quota to complete request

          content: {}

        '404':

          description: Not Found \- Resource does not exist

          content: {}

        '408':

          description: Request Timeout \- Operation exceeded time limit

          content: {}

        '413':

          description: Payload Too Large \- Request payload exceeds size limits

          content: {}

        '422':

          description: Unprocessable Entity \- Semantic validation failure

          content: {}

        '429':

          description: Too Many Requests \- Rate limit exceeded

          content: {}

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

        '502':

          description: Bad Gateway \- Provider/upstream API failure

          content: {}

        '503':

          description: Service Unavailable \- Service temporarily unavailable

          content: {}

      requestBody:

        content:

          application/json:

            schema:

              $ref: '\#/components/schemas/OpenResponsesRequest'

components:

  schemas:

    OutputItemReasoningType:

      type: string

      enum:

        \- value: reasoning

    ReasoningTextContentType:

      type: string

      enum:

        \- value: reasoning\_text

    ReasoningTextContent:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ReasoningTextContentType'

        text:

          type: string

      required:

        \- type

        \- text

    ReasoningSummaryTextType:

      type: string

      enum:

        \- value: summary\_text

    ReasoningSummaryText:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ReasoningSummaryTextType'

        text:

          type: string

      required:

        \- type

        \- text

    OutputItemReasoningStatus0:

      type: string

      enum:

        \- value: completed

    OutputItemReasoningStatus1:

      type: string

      enum:

        \- value: incomplete

    OutputItemReasoningStatus2:

      type: string

      enum:

        \- value: in\_progress

    OutputItemReasoningStatus:

      oneOf:

        \- $ref: '\#/components/schemas/OutputItemReasoningStatus0'

        \- $ref: '\#/components/schemas/OutputItemReasoningStatus1'

        \- $ref: '\#/components/schemas/OutputItemReasoningStatus2'

    OpenResponsesReasoningFormat:

      type: string

      enum:

        \- value: unknown

        \- value: openai-responses-v1

        \- value: xai-responses-v1

        \- value: anthropic-claude-v1

        \- value: google-gemini-v1

    OpenResponsesReasoning:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemReasoningType'

        id:

          type: string

        content:

          type: array

          items:

            $ref: '\#/components/schemas/ReasoningTextContent'

        summary:

          type: array

          items:

            $ref: '\#/components/schemas/ReasoningSummaryText'

        encrypted\_content:

          type:

            \- string

            \- 'null'

        status:

          $ref: '\#/components/schemas/OutputItemReasoningStatus'

        signature:

          type:

            \- string

            \- 'null'

        format:

          oneOf:

            \- $ref: '\#/components/schemas/OpenResponsesReasoningFormat'

            \- type: 'null'

      required:

        \- type

        \- id

        \- summary

    OpenResponsesEasyInputMessageType:

      type: string

      enum:

        \- value: message

    OpenResponsesEasyInputMessageRole0:

      type: string

      enum:

        \- value: user

    OpenResponsesEasyInputMessageRole1:

      type: string

      enum:

        \- value: system

    OpenResponsesEasyInputMessageRole2:

      type: string

      enum:

        \- value: assistant

    OpenResponsesEasyInputMessageRole3:

      type: string

      enum:

        \- value: developer

    OpenResponsesEasyInputMessageRole:

      oneOf:

        \- $ref: '\#/components/schemas/OpenResponsesEasyInputMessageRole0'

        \- $ref: '\#/components/schemas/OpenResponsesEasyInputMessageRole1'

        \- $ref: '\#/components/schemas/OpenResponsesEasyInputMessageRole2'

        \- $ref: '\#/components/schemas/OpenResponsesEasyInputMessageRole3'

    ResponseInputTextType:

      type: string

      enum:

        \- value: input\_text

    ResponseInputText:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponseInputTextType'

        text:

          type: string

      required:

        \- type

        \- text

    ResponseInputImageType:

      type: string

      enum:

        \- value: input\_image

    ResponseInputImageDetail:

      type: string

      enum:

        \- value: auto

        \- value: high

        \- value: low

    ResponseInputImage:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponseInputImageType'

        detail:

          $ref: '\#/components/schemas/ResponseInputImageDetail'

        image\_url:

          type:

            \- string

            \- 'null'

      required:

        \- type

        \- detail

    ResponseInputFileType:

      type: string

      enum:

        \- value: input\_file

    ResponseInputFile:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponseInputFileType'

        file\_id:

          type:

            \- string

            \- 'null'

        file\_data:

          type: string

        filename:

          type: string

        file\_url:

          type: string

      required:

        \- type

    ResponseInputAudioType:

      type: string

      enum:

        \- value: input\_audio

    ResponseInputAudioInputAudioFormat:

      type: string

      enum:

        \- value: mp3

        \- value: wav

    ResponseInputAudioInputAudio:

      type: object

      properties:

        data:

          type: string

        format:

          $ref: '\#/components/schemas/ResponseInputAudioInputAudioFormat'

      required:

        \- data

        \- format

    ResponseInputAudio:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponseInputAudioType'

        input\_audio:

          $ref: '\#/components/schemas/ResponseInputAudioInputAudio'

      required:

        \- type

        \- input\_audio

    OpenResponsesEasyInputMessageContentOneOf0Items:

      oneOf:

        \- $ref: '\#/components/schemas/ResponseInputText'

        \- $ref: '\#/components/schemas/ResponseInputImage'

        \- $ref: '\#/components/schemas/ResponseInputFile'

        \- $ref: '\#/components/schemas/ResponseInputAudio'

    OpenResponsesEasyInputMessageContent0:

      type: array

      items:

        $ref: '\#/components/schemas/OpenResponsesEasyInputMessageContentOneOf0Items'

    OpenResponsesEasyInputMessageContent:

      oneOf:

        \- $ref: '\#/components/schemas/OpenResponsesEasyInputMessageContent0'

        \- type: string

    OpenResponsesEasyInputMessage:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesEasyInputMessageType'

        role:

          $ref: '\#/components/schemas/OpenResponsesEasyInputMessageRole'

        content:

          $ref: '\#/components/schemas/OpenResponsesEasyInputMessageContent'

      required:

        \- role

        \- content

    OpenResponsesInputMessageItemType:

      type: string

      enum:

        \- value: message

    OpenResponsesInputMessageItemRole0:

      type: string

      enum:

        \- value: user

    OpenResponsesInputMessageItemRole1:

      type: string

      enum:

        \- value: system

    OpenResponsesInputMessageItemRole2:

      type: string

      enum:

        \- value: developer

    OpenResponsesInputMessageItemRole:

      oneOf:

        \- $ref: '\#/components/schemas/OpenResponsesInputMessageItemRole0'

        \- $ref: '\#/components/schemas/OpenResponsesInputMessageItemRole1'

        \- $ref: '\#/components/schemas/OpenResponsesInputMessageItemRole2'

    OpenResponsesInputMessageItemContentItems:

      oneOf:

        \- $ref: '\#/components/schemas/ResponseInputText'

        \- $ref: '\#/components/schemas/ResponseInputImage'

        \- $ref: '\#/components/schemas/ResponseInputFile'

        \- $ref: '\#/components/schemas/ResponseInputAudio'

    OpenResponsesInputMessageItem:

      type: object

      properties:

        id:

          type: string

        type:

          $ref: '\#/components/schemas/OpenResponsesInputMessageItemType'

        role:

          $ref: '\#/components/schemas/OpenResponsesInputMessageItemRole'

        content:

          type: array

          items:

            $ref: '\#/components/schemas/OpenResponsesInputMessageItemContentItems'

      required:

        \- role

        \- content

    OpenResponsesFunctionToolCallType:

      type: string

      enum:

        \- value: function\_call

    ToolCallStatus:

      type: string

      enum:

        \- value: in\_progress

        \- value: completed

        \- value: incomplete

    OpenResponsesFunctionToolCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesFunctionToolCallType'

        call\_id:

          type: string

        name:

          type: string

        arguments:

          type: string

        id:

          type: string

        status:

          $ref: '\#/components/schemas/ToolCallStatus'

      required:

        \- type

        \- call\_id

        \- name

        \- arguments

        \- id

    OpenResponsesFunctionCallOutputType:

      type: string

      enum:

        \- value: function\_call\_output

    OpenResponsesFunctionCallOutput:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesFunctionCallOutputType'

        id:

          type:

            \- string

            \- 'null'

        call\_id:

          type: string

        output:

          type: string

        status:

          $ref: '\#/components/schemas/ToolCallStatus'

      required:

        \- type

        \- call\_id

        \- output

    OutputMessageRole:

      type: string

      enum:

        \- value: assistant

    OutputMessageType:

      type: string

      enum:

        \- value: message

    OutputMessageStatus0:

      type: string

      enum:

        \- value: completed

    OutputMessageStatus1:

      type: string

      enum:

        \- value: incomplete

    OutputMessageStatus2:

      type: string

      enum:

        \- value: in\_progress

    OutputMessageStatus:

      oneOf:

        \- $ref: '\#/components/schemas/OutputMessageStatus0'

        \- $ref: '\#/components/schemas/OutputMessageStatus1'

        \- $ref: '\#/components/schemas/OutputMessageStatus2'

    ResponseOutputTextType:

      type: string

      enum:

        \- value: output\_text

    FileCitationType:

      type: string

      enum:

        \- value: file\_citation

    FileCitation:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/FileCitationType'

        file\_id:

          type: string

        filename:

          type: string

        index:

          type: number

          format: double

      required:

        \- type

        \- file\_id

        \- filename

        \- index

    UrlCitationType:

      type: string

      enum:

        \- value: url\_citation

    URLCitation:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/UrlCitationType'

        url:

          type: string

        title:

          type: string

        start\_index:

          type: number

          format: double

        end\_index:

          type: number

          format: double

      required:

        \- type

        \- url

        \- title

        \- start\_index

        \- end\_index

    FilePathType:

      type: string

      enum:

        \- value: file\_path

    FilePath:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/FilePathType'

        file\_id:

          type: string

        index:

          type: number

          format: double

      required:

        \- type

        \- file\_id

        \- index

    OpenAIResponsesAnnotation:

      oneOf:

        \- $ref: '\#/components/schemas/FileCitation'

        \- $ref: '\#/components/schemas/URLCitation'

        \- $ref: '\#/components/schemas/FilePath'

    ResponseOutputText:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponseOutputTextType'

        text:

          type: string

        annotations:

          type: array

          items:

            $ref: '\#/components/schemas/OpenAIResponsesAnnotation'

      required:

        \- type

        \- text

    OpenAiResponsesRefusalContentType:

      type: string

      enum:

        \- value: refusal

    OpenAIResponsesRefusalContent:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenAiResponsesRefusalContentType'

        refusal:

          type: string

      required:

        \- type

        \- refusal

    OutputMessageContentItems:

      oneOf:

        \- $ref: '\#/components/schemas/ResponseOutputText'

        \- $ref: '\#/components/schemas/OpenAIResponsesRefusalContent'

    ResponsesOutputMessage:

      type: object

      properties:

        id:

          type: string

        role:

          $ref: '\#/components/schemas/OutputMessageRole'

        type:

          $ref: '\#/components/schemas/OutputMessageType'

        status:

          $ref: '\#/components/schemas/OutputMessageStatus'

        content:

          type: array

          items:

            $ref: '\#/components/schemas/OutputMessageContentItems'

      required:

        \- id

        \- role

        \- type

        \- content

    ResponsesOutputItemReasoning:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemReasoningType'

        id:

          type: string

        content:

          type: array

          items:

            $ref: '\#/components/schemas/ReasoningTextContent'

        summary:

          type: array

          items:

            $ref: '\#/components/schemas/ReasoningSummaryText'

        encrypted\_content:

          type:

            \- string

            \- 'null'

        status:

          $ref: '\#/components/schemas/OutputItemReasoningStatus'

      required:

        \- type

        \- id

        \- summary

    OutputItemFunctionCallType:

      type: string

      enum:

        \- value: function\_call

    OutputItemFunctionCallStatus0:

      type: string

      enum:

        \- value: completed

    OutputItemFunctionCallStatus1:

      type: string

      enum:

        \- value: incomplete

    OutputItemFunctionCallStatus2:

      type: string

      enum:

        \- value: in\_progress

    OutputItemFunctionCallStatus:

      oneOf:

        \- $ref: '\#/components/schemas/OutputItemFunctionCallStatus0'

        \- $ref: '\#/components/schemas/OutputItemFunctionCallStatus1'

        \- $ref: '\#/components/schemas/OutputItemFunctionCallStatus2'

    ResponsesOutputItemFunctionCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemFunctionCallType'

        id:

          type: string

        name:

          type: string

        arguments:

          type: string

        call\_id:

          type: string

        status:

          $ref: '\#/components/schemas/OutputItemFunctionCallStatus'

      required:

        \- type

        \- name

        \- arguments

        \- call\_id

    OutputItemWebSearchCallType:

      type: string

      enum:

        \- value: web\_search\_call

    WebSearchStatus:

      type: string

      enum:

        \- value: completed

        \- value: searching

        \- value: in\_progress

        \- value: failed

    ResponsesWebSearchCallOutput:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemWebSearchCallType'

        id:

          type: string

        status:

          $ref: '\#/components/schemas/WebSearchStatus'

      required:

        \- type

        \- id

        \- status

    OutputItemFileSearchCallType:

      type: string

      enum:

        \- value: file\_search\_call

    ResponsesOutputItemFileSearchCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemFileSearchCallType'

        id:

          type: string

        queries:

          type: array

          items:

            type: string

        status:

          $ref: '\#/components/schemas/WebSearchStatus'

      required:

        \- type

        \- id

        \- queries

        \- status

    OutputItemImageGenerationCallType:

      type: string

      enum:

        \- value: image\_generation\_call

    ImageGenerationStatus:

      type: string

      enum:

        \- value: in\_progress

        \- value: completed

        \- value: generating

        \- value: failed

    ResponsesImageGenerationCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemImageGenerationCallType'

        id:

          type: string

        result:

          type:

            \- string

            \- 'null'

        status:

          $ref: '\#/components/schemas/ImageGenerationStatus'

      required:

        \- type

        \- id

        \- status

    OpenResponsesInputOneOf1Items:

      oneOf:

        \- $ref: '\#/components/schemas/OpenResponsesReasoning'

        \- $ref: '\#/components/schemas/OpenResponsesEasyInputMessage'

        \- $ref: '\#/components/schemas/OpenResponsesInputMessageItem'

        \- $ref: '\#/components/schemas/OpenResponsesFunctionToolCall'

        \- $ref: '\#/components/schemas/OpenResponsesFunctionCallOutput'

        \- $ref: '\#/components/schemas/ResponsesOutputMessage'

        \- $ref: '\#/components/schemas/ResponsesOutputItemReasoning'

        \- $ref: '\#/components/schemas/ResponsesOutputItemFunctionCall'

        \- $ref: '\#/components/schemas/ResponsesWebSearchCallOutput'

        \- $ref: '\#/components/schemas/ResponsesOutputItemFileSearchCall'

        \- $ref: '\#/components/schemas/ResponsesImageGenerationCall'

    OpenResponsesInput1:

      type: array

      items:

        $ref: '\#/components/schemas/OpenResponsesInputOneOf1Items'

    OpenResponsesInput:

      oneOf:

        \- type: string

        \- $ref: '\#/components/schemas/OpenResponsesInput1'

    OpenResponsesRequestMetadata:

      type: object

      additionalProperties:

        type: string

    OpenResponsesWebSearchPreviewToolType:

      type: string

      enum:

        \- value: web\_search\_preview

    ResponsesSearchContextSize:

      type: string

      enum:

        \- value: low

        \- value: medium

        \- value: high

    WebSearchPreviewToolUserLocationType:

      type: string

      enum:

        \- value: approximate

    WebSearchPreviewToolUserLocation:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/WebSearchPreviewToolUserLocationType'

        city:

          type:

            \- string

            \- 'null'

        country:

          type:

            \- string

            \- 'null'

        region:

          type:

            \- string

            \- 'null'

        timezone:

          type:

            \- string

            \- 'null'

      required:

        \- type

    OpenResponsesWebSearchPreviewTool:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesWebSearchPreviewToolType'

        search\_context\_size:

          $ref: '\#/components/schemas/ResponsesSearchContextSize'

        user\_location:

          $ref: '\#/components/schemas/WebSearchPreviewToolUserLocation'

      required:

        \- type

    OpenResponsesWebSearchPreview20250311ToolType:

      type: string

      enum:

        \- value: web\_search\_preview\_2025\_03\_11

    OpenResponsesWebSearchPreview20250311Tool:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesWebSearchPreview20250311ToolType'

        search\_context\_size:

          $ref: '\#/components/schemas/ResponsesSearchContextSize'

        user\_location:

          $ref: '\#/components/schemas/WebSearchPreviewToolUserLocation'

      required:

        \- type

    OpenResponsesWebSearchToolType:

      type: string

      enum:

        \- value: web\_search

    OpenResponsesWebSearchToolFilters:

      type: object

      properties:

        allowed\_domains:

          type:

            \- array

            \- 'null'

          items:

            type: string

    ResponsesWebSearchUserLocationType:

      type: string

      enum:

        \- value: approximate

    ResponsesWebSearchUserLocation:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponsesWebSearchUserLocationType'

        city:

          type:

            \- string

            \- 'null'

        country:

          type:

            \- string

            \- 'null'

        region:

          type:

            \- string

            \- 'null'

        timezone:

          type:

            \- string

            \- 'null'

    OpenResponsesWebSearchTool:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesWebSearchToolType'

        filters:

          oneOf:

            \- $ref: '\#/components/schemas/OpenResponsesWebSearchToolFilters'

            \- type: 'null'

        search\_context\_size:

          $ref: '\#/components/schemas/ResponsesSearchContextSize'

        user\_location:

          $ref: '\#/components/schemas/ResponsesWebSearchUserLocation'

      required:

        \- type

    OpenResponsesWebSearch20250826ToolType:

      type: string

      enum:

        \- value: web\_search\_2025\_08\_26

    OpenResponsesWebSearch20250826ToolFilters:

      type: object

      properties:

        allowed\_domains:

          type:

            \- array

            \- 'null'

          items:

            type: string

    OpenResponsesWebSearch20250826Tool:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenResponsesWebSearch20250826ToolType'

        filters:

          oneOf:

            \- $ref: '\#/components/schemas/OpenResponsesWebSearch20250826ToolFilters'

            \- type: 'null'

        search\_context\_size:

          $ref: '\#/components/schemas/ResponsesSearchContextSize'

        user\_location:

          $ref: '\#/components/schemas/ResponsesWebSearchUserLocation'

      required:

        \- type

    OpenResponsesRequestToolsItems:

      oneOf:

        \- type: object

          additionalProperties:

            description: Any type

        \- $ref: '\#/components/schemas/OpenResponsesWebSearchPreviewTool'

        \- $ref: '\#/components/schemas/OpenResponsesWebSearchPreview20250311Tool'

        \- $ref: '\#/components/schemas/OpenResponsesWebSearchTool'

        \- $ref: '\#/components/schemas/OpenResponsesWebSearch20250826Tool'

    OpenAiResponsesToolChoice0:

      type: string

      enum:

        \- value: auto

    OpenAiResponsesToolChoice1:

      type: string

      enum:

        \- value: none

    OpenAiResponsesToolChoice2:

      type: string

      enum:

        \- value: required

    OpenAiResponsesToolChoiceOneOf3Type:

      type: string

      enum:

        \- value: function

    OpenAiResponsesToolChoice3:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenAiResponsesToolChoiceOneOf3Type'

        name:

          type: string

      required:

        \- type

        \- name

    OpenAiResponsesToolChoiceOneOf4Type0:

      type: string

      enum:

        \- value: web\_search\_preview\_2025\_03\_11

    OpenAiResponsesToolChoiceOneOf4Type1:

      type: string

      enum:

        \- value: web\_search\_preview

    OpenAiResponsesToolChoiceOneOf4Type:

      oneOf:

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoiceOneOf4Type0'

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoiceOneOf4Type1'

    OpenAiResponsesToolChoice4:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenAiResponsesToolChoiceOneOf4Type'

      required:

        \- type

    OpenAIResponsesToolChoice:

      oneOf:

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoice0'

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoice1'

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoice2'

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoice3'

        \- $ref: '\#/components/schemas/OpenAiResponsesToolChoice4'

    ResponsesFormatTextType:

      type: string

      enum:

        \- value: text

    ResponsesFormatText:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponsesFormatTextType'

      required:

        \- type

    ResponsesFormatJsonObjectType:

      type: string

      enum:

        \- value: json\_object

    ResponsesFormatJSONObject:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponsesFormatJsonObjectType'

      required:

        \- type

    ResponsesFormatTextJsonSchemaConfigType:

      type: string

      enum:

        \- value: json\_schema

    ResponsesFormatTextJSONSchemaConfig:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/ResponsesFormatTextJsonSchemaConfigType'

        name:

          type: string

        description:

          type: string

        strict:

          type:

            \- boolean

            \- 'null'

        schema:

          type: object

          additionalProperties:

            description: Any type

      required:

        \- type

        \- name

        \- schema

    ResponseFormatTextConfig:

      oneOf:

        \- $ref: '\#/components/schemas/ResponsesFormatText'

        \- $ref: '\#/components/schemas/ResponsesFormatJSONObject'

        \- $ref: '\#/components/schemas/ResponsesFormatTextJSONSchemaConfig'

    ResponseTextConfigVerbosity:

      type: string

      enum:

        \- value: high

        \- value: low

        \- value: medium

    OpenResponsesResponseText:

      type: object

      properties:

        format:

          $ref: '\#/components/schemas/ResponseFormatTextConfig'

        verbosity:

          oneOf:

            \- $ref: '\#/components/schemas/ResponseTextConfigVerbosity'

            \- type: 'null'

    OpenAIResponsesReasoningEffort:

      type: string

      enum:

        \- value: xhigh

        \- value: high

        \- value: medium

        \- value: low

        \- value: minimal

        \- value: none

    ReasoningSummaryVerbosity:

      type: string

      enum:

        \- value: auto

        \- value: concise

        \- value: detailed

    OpenResponsesReasoningConfig:

      type: object

      properties:

        effort:

          $ref: '\#/components/schemas/OpenAIResponsesReasoningEffort'

        summary:

          $ref: '\#/components/schemas/ReasoningSummaryVerbosity'

        max\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        enabled:

          type:

            \- boolean

            \- 'null'

    OpenAiResponsesPromptVariables:

      oneOf:

        \- type: string

        \- $ref: '\#/components/schemas/ResponseInputText'

        \- $ref: '\#/components/schemas/ResponseInputImage'

        \- $ref: '\#/components/schemas/ResponseInputFile'

    OpenAIResponsesPrompt:

      type: object

      properties:

        id:

          type: string

        variables:

          type:

            \- object

            \- 'null'

          additionalProperties:

            $ref: '\#/components/schemas/OpenAiResponsesPromptVariables'

      required:

        \- id

    OpenAIResponsesIncludable:

      type: string

      enum:

        \- value: file\_search\_call.results

        \- value: message.input\_image.image\_url

        \- value: computer\_call\_output.output.image\_url

        \- value: reasoning.encrypted\_content

        \- value: code\_interpreter\_call.outputs

    OpenResponsesRequestServiceTier:

      type: string

      enum:

        \- value: auto

      default: auto

    OpenResponsesRequestTruncation:

      type: object

      properties: {}

    DataCollection:

      type: string

      enum:

        \- value: deny

        \- value: allow

    ProviderName:

      type: string

      enum:

        \- value: AI21

        \- value: AionLabs

        \- value: Alibaba

        \- value: Amazon Bedrock

        \- value: Amazon Nova

        \- value: Anthropic

        \- value: Arcee AI

        \- value: AtlasCloud

        \- value: Avian

        \- value: Azure

        \- value: BaseTen

        \- value: BytePlus

        \- value: Black Forest Labs

        \- value: Cerebras

        \- value: Chutes

        \- value: Cirrascale

        \- value: Clarifai

        \- value: Cloudflare

        \- value: Cohere

        \- value: Crusoe

        \- value: DeepInfra

        \- value: DeepSeek

        \- value: Featherless

        \- value: Fireworks

        \- value: Friendli

        \- value: GMICloud

        \- value: GoPomelo

        \- value: Google

        \- value: Google AI Studio

        \- value: Groq

        \- value: Hyperbolic

        \- value: Inception

        \- value: InferenceNet

        \- value: Infermatic

        \- value: Inflection

        \- value: Liquid

        \- value: Mara

        \- value: Mancer 2

        \- value: Minimax

        \- value: ModelRun

        \- value: Mistral

        \- value: Modular

        \- value: Moonshot AI

        \- value: Morph

        \- value: NCompass

        \- value: Nebius

        \- value: NextBit

        \- value: Novita

        \- value: Nvidia

        \- value: OpenAI

        \- value: OpenInference

        \- value: Parasail

        \- value: Perplexity

        \- value: Phala

        \- value: Relace

        \- value: SambaNova

        \- value: SiliconFlow

        \- value: Sourceful

        \- value: Stealth

        \- value: StreamLake

        \- value: Switchpoint

        \- value: Targon

        \- value: Together

        \- value: Venice

        \- value: WandB

        \- value: Xiaomi

        \- value: xAI

        \- value: Z.AI

        \- value: FakeProvider

    OpenResponsesRequestProviderOrderItems:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderName'

        \- type: string

    OpenResponsesRequestProviderOnlyItems:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderName'

        \- type: string

    OpenResponsesRequestProviderIgnoreItems:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderName'

        \- type: string

    Quantization:

      type: string

      enum:

        \- value: int4

        \- value: int8

        \- value: fp4

        \- value: fp6

        \- value: fp8

        \- value: fp16

        \- value: bf16

        \- value: fp32

        \- value: unknown

    ProviderSort:

      type: string

      enum:

        \- value: price

        \- value: throughput

        \- value: latency

    ProviderSortConfigPartition:

      type: string

      enum:

        \- value: model

        \- value: none

    ProviderSortConfig:

      type: object

      properties:

        by:

          oneOf:

            \- $ref: '\#/components/schemas/ProviderSort'

            \- type: 'null'

        partition:

          oneOf:

            \- $ref: '\#/components/schemas/ProviderSortConfigPartition'

            \- type: 'null'

    OpenResponsesRequestProviderSort:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderSort'

        \- $ref: '\#/components/schemas/ProviderSortConfig'

        \- description: Any type

    BigNumberUnion:

      type: string

    OpenResponsesRequestProviderMaxPrice:

      type: object

      properties:

        prompt:

          $ref: '\#/components/schemas/BigNumberUnion'

        completion:

          $ref: '\#/components/schemas/BigNumberUnion'

        image:

          $ref: '\#/components/schemas/BigNumberUnion'

        audio:

          $ref: '\#/components/schemas/BigNumberUnion'

        request:

          $ref: '\#/components/schemas/BigNumberUnion'

    OpenResponsesRequestProvider:

      type: object

      properties:

        allow\_fallbacks:

          type:

            \- boolean

            \- 'null'

          description: \>

            Whether to allow backup providers to serve requests

            \- true: (default) when the primary provider (or your custom

            providers in "order") is unavailable, use the next best provider.

            \- false: use only the primary/custom provider, and return the

            upstream error if it's unavailable.

        require\_parameters:

          type:

            \- boolean

            \- 'null'

          description: \>-

            Whether to filter providers to only those that support the

            parameters you've provided. If this setting is omitted or set to

            false, then providers will receive only the parameters they support,

            and ignore the rest.

        data\_collection:

          $ref: '\#/components/schemas/DataCollection'

        zdr:

          type:

            \- boolean

            \- 'null'

          description: \>-

            Whether to restrict routing to only ZDR (Zero Data Retention)

            endpoints. When true, only endpoints that do not retain prompts will

            be used.

        enforce\_distillable\_text:

          type:

            \- boolean

            \- 'null'

          description: \>-

            Whether to restrict routing to only models that allow text

            distillation. When true, only models where the author has allowed

            distillation will be used.

        order:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/OpenResponsesRequestProviderOrderItems'

          description: \>-

            An ordered list of provider slugs. The router will attempt to use

            the first provider in the subset of this list that supports your

            requested model, and fall back to the next if it is unavailable. If

            no providers are available, the request will fail with an error

            message.

        only:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/OpenResponsesRequestProviderOnlyItems'

          description: \>-

            List of provider slugs to allow. If provided, this list is merged

            with your account-wide allowed provider settings for this request.

        ignore:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/OpenResponsesRequestProviderIgnoreItems'

          description: \>-

            List of provider slugs to ignore. If provided, this list is merged

            with your account-wide ignored provider settings for this request.

        quantizations:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/Quantization'

          description: A list of quantization levels to filter the provider by.

        sort:

          $ref: '\#/components/schemas/OpenResponsesRequestProviderSort'

          description: \>-

            The sorting strategy to use for this request, if "order" is not

            specified. When set, no load balancing is performed.

        max\_price:

          $ref: '\#/components/schemas/OpenResponsesRequestProviderMaxPrice'

          description: \>-

            The object specifying the maximum price you want to pay for this

            request. USD price per million tokens, for prompt and completion.

        preferred\_min\_throughput:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            Preferred minimum throughput (in tokens per second). Endpoints below

            this threshold may still be used, but are deprioritized in routing.

            When using fallback models, this may cause a fallback model to be

            used instead of the primary model if it meets the threshold.

        preferred\_max\_latency:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            Preferred maximum latency (in seconds). Endpoints above this

            threshold may still be used, but are deprioritized in routing. When

            using fallback models, this may cause a fallback model to be used

            instead of the primary model if it meets the threshold.

        min\_throughput:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            \*\*DEPRECATED\*\* Use preferred\_min\_throughput instead.

            Backwards-compatible alias for preferred\_min\_throughput.

        max\_latency:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            \*\*DEPRECATED\*\* Use preferred\_max\_latency instead.

            Backwards-compatible alias for preferred\_max\_latency.

    OpenResponsesRequestPluginsItemsOneOf0Id:

      type: string

      enum:

        \- value: moderation

    OpenResponsesRequestPluginsItems0:

      type: object

      properties:

        id:

          $ref: '\#/components/schemas/OpenResponsesRequestPluginsItemsOneOf0Id'

      required:

        \- id

    OpenResponsesRequestPluginsItemsOneOf1Id:

      type: string

      enum:

        \- value: web

    WebSearchEngine:

      type: string

      enum:

        \- value: native

        \- value: exa

    OpenResponsesRequestPluginsItems1:

      type: object

      properties:

        id:

          $ref: '\#/components/schemas/OpenResponsesRequestPluginsItemsOneOf1Id'

        enabled:

          type: boolean

          description: \>-

            Set to false to disable the web-search plugin for this request.

            Defaults to true.

        max\_results:

          type: number

          format: double

        search\_prompt:

          type: string

        engine:

          $ref: '\#/components/schemas/WebSearchEngine'

      required:

        \- id

    OpenResponsesRequestPluginsItemsOneOf2Id:

      type: string

      enum:

        \- value: file-parser

    PDFParserEngine:

      type: string

      enum:

        \- value: mistral-ocr

        \- value: pdf-text

        \- value: native

    PDFParserOptions:

      type: object

      properties:

        engine:

          $ref: '\#/components/schemas/PDFParserEngine'

    OpenResponsesRequestPluginsItems2:

      type: object

      properties:

        id:

          $ref: '\#/components/schemas/OpenResponsesRequestPluginsItemsOneOf2Id'

        enabled:

          type: boolean

          description: \>-

            Set to false to disable the file-parser plugin for this request.

            Defaults to true.

        pdf:

          $ref: '\#/components/schemas/PDFParserOptions'

      required:

        \- id

    OpenResponsesRequestPluginsItemsOneOf3Id:

      type: string

      enum:

        \- value: response-healing

    OpenResponsesRequestPluginsItems3:

      type: object

      properties:

        id:

          $ref: '\#/components/schemas/OpenResponsesRequestPluginsItemsOneOf3Id'

        enabled:

          type: boolean

          description: \>-

            Set to false to disable the response-healing plugin for this

            request. Defaults to true.

      required:

        \- id

    OpenResponsesRequestPluginsItems:

      oneOf:

        \- $ref: '\#/components/schemas/OpenResponsesRequestPluginsItems0'

        \- $ref: '\#/components/schemas/OpenResponsesRequestPluginsItems1'

        \- $ref: '\#/components/schemas/OpenResponsesRequestPluginsItems2'

        \- $ref: '\#/components/schemas/OpenResponsesRequestPluginsItems3'

    OpenResponsesRequest:

      type: object

      properties:

        input:

          $ref: '\#/components/schemas/OpenResponsesInput'

        instructions:

          type:

            \- string

            \- 'null'

        metadata:

          $ref: '\#/components/schemas/OpenResponsesRequestMetadata'

        tools:

          type: array

          items:

            $ref: '\#/components/schemas/OpenResponsesRequestToolsItems'

        tool\_choice:

          $ref: '\#/components/schemas/OpenAIResponsesToolChoice'

        parallel\_tool\_calls:

          type:

            \- boolean

            \- 'null'

        model:

          type: string

        models:

          type: array

          items:

            type: string

        text:

          $ref: '\#/components/schemas/OpenResponsesResponseText'

        reasoning:

          $ref: '\#/components/schemas/OpenResponsesReasoningConfig'

        max\_output\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        temperature:

          type:

            \- number

            \- 'null'

          format: double

        top\_p:

          type:

            \- number

            \- 'null'

          format: double

        top\_k:

          type: number

          format: double

        prompt\_cache\_key:

          type:

            \- string

            \- 'null'

        previous\_response\_id:

          type:

            \- string

            \- 'null'

        prompt:

          $ref: '\#/components/schemas/OpenAIResponsesPrompt'

        include:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/OpenAIResponsesIncludable'

        background:

          type:

            \- boolean

            \- 'null'

        safety\_identifier:

          type:

            \- string

            \- 'null'

        store:

          type: string

          enum:

            \- type: booleanLiteral

              value: false

        service\_tier:

          $ref: '\#/components/schemas/OpenResponsesRequestServiceTier'

        truncation:

          $ref: '\#/components/schemas/OpenResponsesRequestTruncation'

        stream:

          type: boolean

          default: false

        provider:

          oneOf:

            \- $ref: '\#/components/schemas/OpenResponsesRequestProvider'

            \- type: 'null'

          description: \>-

            When multiple model providers are available, optionally indicate

            your routing preference.

        plugins:

          type: array

          items:

            $ref: '\#/components/schemas/OpenResponsesRequestPluginsItems'

          description: \>-

            Plugins you want to enable for this request, including their

            settings.

        user:

          type: string

          description: \>-

            A unique identifier representing your end-user, which helps

            distinguish between different users of your app. This allows your

            app to identify specific users in case of abuse reports, preventing

            your entire app from being affected by the actions of individual

            users. Maximum of 128 characters.

        session\_id:

          type: string

          description: \>-

            A unique identifier for grouping related requests (e.g., a

            conversation or agent workflow) for observability. If provided in

            both the request body and the x-session-id header, the body value

            takes precedence. Maximum of 128 characters.

    OpenAiResponsesNonStreamingResponseObject:

      type: string

      enum:

        \- value: response

    OpenAIResponsesResponseStatus:

      type: string

      enum:

        \- value: completed

        \- value: incomplete

        \- value: in\_progress

        \- value: failed

        \- value: cancelled

        \- value: queued

    OutputMessage:

      type: object

      properties:

        id:

          type: string

        role:

          $ref: '\#/components/schemas/OutputMessageRole'

        type:

          $ref: '\#/components/schemas/OutputMessageType'

        status:

          $ref: '\#/components/schemas/OutputMessageStatus'

        content:

          type: array

          items:

            $ref: '\#/components/schemas/OutputMessageContentItems'

      required:

        \- id

        \- role

        \- type

        \- content

    OutputItemReasoning:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemReasoningType'

        id:

          type: string

        content:

          type: array

          items:

            $ref: '\#/components/schemas/ReasoningTextContent'

        summary:

          type: array

          items:

            $ref: '\#/components/schemas/ReasoningSummaryText'

        encrypted\_content:

          type:

            \- string

            \- 'null'

        status:

          $ref: '\#/components/schemas/OutputItemReasoningStatus'

      required:

        \- type

        \- id

        \- summary

    OutputItemFunctionCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemFunctionCallType'

        id:

          type: string

        name:

          type: string

        arguments:

          type: string

        call\_id:

          type: string

        status:

          $ref: '\#/components/schemas/OutputItemFunctionCallStatus'

      required:

        \- type

        \- name

        \- arguments

        \- call\_id

    OutputItemWebSearchCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemWebSearchCallType'

        id:

          type: string

        status:

          $ref: '\#/components/schemas/WebSearchStatus'

      required:

        \- type

        \- id

        \- status

    OutputItemFileSearchCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemFileSearchCallType'

        id:

          type: string

        queries:

          type: array

          items:

            type: string

        status:

          $ref: '\#/components/schemas/WebSearchStatus'

      required:

        \- type

        \- id

        \- queries

        \- status

    OutputItemImageGenerationCall:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OutputItemImageGenerationCallType'

        id:

          type: string

        result:

          type:

            \- string

            \- 'null'

        status:

          $ref: '\#/components/schemas/ImageGenerationStatus'

      required:

        \- type

        \- id

        \- status

    OpenAiResponsesNonStreamingResponseOutputItems:

      oneOf:

        \- $ref: '\#/components/schemas/OutputMessage'

        \- $ref: '\#/components/schemas/OutputItemReasoning'

        \- $ref: '\#/components/schemas/OutputItemFunctionCall'

        \- $ref: '\#/components/schemas/OutputItemWebSearchCall'

        \- $ref: '\#/components/schemas/OutputItemFileSearchCall'

        \- $ref: '\#/components/schemas/OutputItemImageGenerationCall'

    ResponsesErrorFieldCode:

      type: string

      enum:

        \- value: server\_error

        \- value: rate\_limit\_exceeded

        \- value: invalid\_prompt

        \- value: vector\_store\_timeout

        \- value: invalid\_image

        \- value: invalid\_image\_format

        \- value: invalid\_base64\_image

        \- value: invalid\_image\_url

        \- value: image\_too\_large

        \- value: image\_too\_small

        \- value: image\_parse\_error

        \- value: image\_content\_policy\_violation

        \- value: invalid\_image\_mode

        \- value: image\_file\_too\_large

        \- value: unsupported\_image\_media\_type

        \- value: empty\_image\_file

        \- value: failed\_to\_download\_image

        \- value: image\_file\_not\_found

    ResponsesErrorField:

      type: object

      properties:

        code:

          $ref: '\#/components/schemas/ResponsesErrorFieldCode'

        message:

          type: string

      required:

        \- code

        \- message

    OpenAiResponsesIncompleteDetailsReason:

      type: string

      enum:

        \- value: max\_output\_tokens

        \- value: content\_filter

    OpenAIResponsesIncompleteDetails:

      type: object

      properties:

        reason:

          $ref: '\#/components/schemas/OpenAiResponsesIncompleteDetailsReason'

    OpenAiResponsesUsageInputTokensDetails:

      type: object

      properties:

        cached\_tokens:

          type: number

          format: double

      required:

        \- cached\_tokens

    OpenAiResponsesUsageOutputTokensDetails:

      type: object

      properties:

        reasoning\_tokens:

          type: number

          format: double

      required:

        \- reasoning\_tokens

    OpenAIResponsesUsage:

      type: object

      properties:

        input\_tokens:

          type: number

          format: double

        input\_tokens\_details:

          $ref: '\#/components/schemas/OpenAiResponsesUsageInputTokensDetails'

        output\_tokens:

          type: number

          format: double

        output\_tokens\_details:

          $ref: '\#/components/schemas/OpenAiResponsesUsageOutputTokensDetails'

        total\_tokens:

          type: number

          format: double

      required:

        \- input\_tokens

        \- input\_tokens\_details

        \- output\_tokens

        \- output\_tokens\_details

        \- total\_tokens

    OpenAiResponsesInputOneOf1ItemsOneOf0Type:

      type: string

      enum:

        \- value: message

    OpenAiResponsesInputOneOf1ItemsOneOf0Role0:

      type: string

      enum:

        \- value: user

    OpenAiResponsesInputOneOf1ItemsOneOf0Role1:

      type: string

      enum:

        \- value: system

    OpenAiResponsesInputOneOf1ItemsOneOf0Role2:

      type: string

      enum:

        \- value: assistant

    OpenAiResponsesInputOneOf1ItemsOneOf0Role3:

      type: string

      enum:

        \- value: developer

    OpenAiResponsesInputOneOf1ItemsOneOf0Role:

      oneOf:

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Role0'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Role1'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Role2'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Role3'

    OpenAiResponsesInputOneOf1ItemsOneOf0ContentOneOf0Items:

      oneOf:

        \- $ref: '\#/components/schemas/ResponseInputText'

        \- $ref: '\#/components/schemas/ResponseInputImage'

        \- $ref: '\#/components/schemas/ResponseInputFile'

        \- $ref: '\#/components/schemas/ResponseInputAudio'

    OpenAiResponsesInputOneOf1ItemsOneOf0Content0:

      type: array

      items:

        $ref: \>-

          \#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0ContentOneOf0Items

    OpenAiResponsesInputOneOf1ItemsOneOf0Content:

      oneOf:

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Content0'

        \- type: string

    OpenAiResponsesInputOneOf1Items0:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Type'

        role:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Role'

        content:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf0Content'

      required:

        \- role

        \- content

    OpenAiResponsesInputOneOf1ItemsOneOf1Type:

      type: string

      enum:

        \- value: message

    OpenAiResponsesInputOneOf1ItemsOneOf1Role0:

      type: string

      enum:

        \- value: user

    OpenAiResponsesInputOneOf1ItemsOneOf1Role1:

      type: string

      enum:

        \- value: system

    OpenAiResponsesInputOneOf1ItemsOneOf1Role2:

      type: string

      enum:

        \- value: developer

    OpenAiResponsesInputOneOf1ItemsOneOf1Role:

      oneOf:

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf1Role0'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf1Role1'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf1Role2'

    OpenAiResponsesInputOneOf1ItemsOneOf1ContentItems:

      oneOf:

        \- $ref: '\#/components/schemas/ResponseInputText'

        \- $ref: '\#/components/schemas/ResponseInputImage'

        \- $ref: '\#/components/schemas/ResponseInputFile'

        \- $ref: '\#/components/schemas/ResponseInputAudio'

    OpenAiResponsesInputOneOf1Items1:

      type: object

      properties:

        id:

          type: string

        type:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf1Type'

        role:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf1Role'

        content:

          type: array

          items:

            $ref: \>-

              \#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf1ContentItems

      required:

        \- id

        \- role

        \- content

    OpenAiResponsesInputOneOf1ItemsOneOf2Type:

      type: string

      enum:

        \- value: function\_call\_output

    OpenAiResponsesInputOneOf1Items2:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf2Type'

        id:

          type:

            \- string

            \- 'null'

        call\_id:

          type: string

        output:

          type: string

        status:

          $ref: '\#/components/schemas/ToolCallStatus'

      required:

        \- type

        \- call\_id

        \- output

    OpenAiResponsesInputOneOf1ItemsOneOf3Type:

      type: string

      enum:

        \- value: function\_call

    OpenAiResponsesInputOneOf1Items3:

      type: object

      properties:

        type:

          $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1ItemsOneOf3Type'

        call\_id:

          type: string

        name:

          type: string

        arguments:

          type: string

        id:

          type: string

        status:

          $ref: '\#/components/schemas/ToolCallStatus'

      required:

        \- type

        \- call\_id

        \- name

        \- arguments

    OpenAiResponsesInputOneOf1Items:

      oneOf:

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1Items0'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1Items1'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1Items2'

        \- $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1Items3'

        \- $ref: '\#/components/schemas/OutputItemImageGenerationCall'

        \- $ref: '\#/components/schemas/OutputMessage'

    OpenAiResponsesInput1:

      type: array

      items:

        $ref: '\#/components/schemas/OpenAiResponsesInputOneOf1Items'

    OpenAIResponsesInput:

      oneOf:

        \- type: string

        \- $ref: '\#/components/schemas/OpenAiResponsesInput1'

        \- description: Any type

    OpenAiResponsesNonStreamingResponseToolsItems:

      oneOf:

        \- type: object

          additionalProperties:

            description: Any type

        \- $ref: '\#/components/schemas/OpenResponsesWebSearchPreviewTool'

        \- $ref: '\#/components/schemas/OpenResponsesWebSearchPreview20250311Tool'

        \- $ref: '\#/components/schemas/OpenResponsesWebSearchTool'

        \- $ref: '\#/components/schemas/OpenResponsesWebSearch20250826Tool'

    OpenAIResponsesReasoningConfig:

      type: object

      properties:

        effort:

          $ref: '\#/components/schemas/OpenAIResponsesReasoningEffort'

        summary:

          $ref: '\#/components/schemas/ReasoningSummaryVerbosity'

    OpenAIResponsesServiceTier:

      type: string

      enum:

        \- value: auto

        \- value: default

        \- value: flex

        \- value: priority

        \- value: scale

    OpenAIResponsesTruncation:

      type: string

      enum:

        \- value: auto

        \- value: disabled

    ResponseTextConfig:

      type: object

      properties:

        format:

          $ref: '\#/components/schemas/ResponseFormatTextConfig'

        verbosity:

          oneOf:

            \- $ref: '\#/components/schemas/ResponseTextConfigVerbosity'

            \- type: 'null'

    ResponsesOutputItem:

      oneOf:

        \- $ref: '\#/components/schemas/ResponsesOutputMessage'

        \- $ref: '\#/components/schemas/ResponsesOutputItemReasoning'

        \- $ref: '\#/components/schemas/ResponsesOutputItemFunctionCall'

        \- $ref: '\#/components/schemas/ResponsesWebSearchCallOutput'

        \- $ref: '\#/components/schemas/ResponsesOutputItemFileSearchCall'

        \- $ref: '\#/components/schemas/ResponsesImageGenerationCall'

    OpenResponsesUsageCostDetails:

      type: object

      properties:

        upstream\_inference\_cost:

          type:

            \- number

            \- 'null'

          format: double

        upstream\_inference\_input\_cost:

          type: number

          format: double

        upstream\_inference\_output\_cost:

          type: number

          format: double

      required:

        \- upstream\_inference\_input\_cost

        \- upstream\_inference\_output\_cost

    OpenResponsesUsage:

      type: object

      properties:

        input\_tokens:

          type: number

          format: double

        input\_tokens\_details:

          $ref: '\#/components/schemas/OpenAiResponsesUsageInputTokensDetails'

        output\_tokens:

          type: number

          format: double

        output\_tokens\_details:

          $ref: '\#/components/schemas/OpenAiResponsesUsageOutputTokensDetails'

        total\_tokens:

          type: number

          format: double

        cost:

          type:

            \- number

            \- 'null'

          format: double

          description: Cost of the completion

        is\_byok:

          type: boolean

          description: Whether a request was made using a Bring Your Own Key configuration

        cost\_details:

          $ref: '\#/components/schemas/OpenResponsesUsageCostDetails'

      required:

        \- input\_tokens

        \- input\_tokens\_details

        \- output\_tokens

        \- output\_tokens\_details

        \- total\_tokens

    OpenResponsesNonStreamingResponse:

      type: object

      properties:

        id:

          type: string

        object:

          $ref: '\#/components/schemas/OpenAiResponsesNonStreamingResponseObject'

        created\_at:

          type: number

          format: double

        model:

          type: string

        status:

          $ref: '\#/components/schemas/OpenAIResponsesResponseStatus'

        output:

          type: array

          items:

            $ref: '\#/components/schemas/ResponsesOutputItem'

        user:

          type:

            \- string

            \- 'null'

        output\_text:

          type: string

        prompt\_cache\_key:

          type:

            \- string

            \- 'null'

        safety\_identifier:

          type:

            \- string

            \- 'null'

        error:

          $ref: '\#/components/schemas/ResponsesErrorField'

        incomplete\_details:

          $ref: '\#/components/schemas/OpenAIResponsesIncompleteDetails'

        usage:

          $ref: '\#/components/schemas/OpenResponsesUsage'

        max\_tool\_calls:

          type:

            \- number

            \- 'null'

          format: double

        top\_logprobs:

          type: number

          format: double

        max\_output\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        temperature:

          type:

            \- number

            \- 'null'

          format: double

        top\_p:

          type:

            \- number

            \- 'null'

          format: double

        instructions:

          $ref: '\#/components/schemas/OpenAIResponsesInput'

        metadata:

          $ref: '\#/components/schemas/OpenResponsesRequestMetadata'

        tools:

          type: array

          items:

            $ref: '\#/components/schemas/OpenAiResponsesNonStreamingResponseToolsItems'

        tool\_choice:

          $ref: '\#/components/schemas/OpenAIResponsesToolChoice'

        parallel\_tool\_calls:

          type: boolean

        prompt:

          $ref: '\#/components/schemas/OpenAIResponsesPrompt'

        background:

          type:

            \- boolean

            \- 'null'

        previous\_response\_id:

          type:

            \- string

            \- 'null'

        reasoning:

          $ref: '\#/components/schemas/OpenAIResponsesReasoningConfig'

        service\_tier:

          $ref: '\#/components/schemas/OpenAIResponsesServiceTier'

        store:

          type: boolean

        truncation:

          $ref: '\#/components/schemas/OpenAIResponsesTruncation'

        text:

          $ref: '\#/components/schemas/ResponseTextConfig'

      required:

        \- id

        \- object

        \- created\_at

        \- model

        \- output

        \- error

        \- incomplete\_details

        \- temperature

        \- top\_p

        \- instructions

        \- metadata

        \- tools

        \- tool\_choice

        \- parallel\_tool\_calls

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/responses"

payload \= {

    "input": \[

        {

            "type": "message",

            "role": "user",

            "content": "Hello, how are you?"

        }

    \],

    "tools": \[

        {

            "type": "function",

            "name": "get\_current\_weather",

            "description": "Get the current weather in a given location",

            "parameters": {

                "type": "object",

                "properties": { "location": { "type": "string" } }

            }

        }

    \],

    "model": "anthropic/claude-4.5-sonnet-20250929",

    "temperature": 0.7,

    "top\_p": 0.9

}

headers \= {

    "Authorization": "Bearer \<token\>",

    "Content-Type": "application/json"

}

response \= requests.post(url, json=payload, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/responses';

const options \= {

  method: 'POST',

  headers: {Authorization: 'Bearer \<token\>', 'Content-Type': 'application/json'},

  body: '{"input":\[{"type":"message","role":"user","content":"Hello, how are you?"}\],"tools":\[{"type":"function","name":"get\_current\_weather","description":"Get the current weather in a given location","parameters":{"type":"object","properties":{"location":{"type":"string"}}}}\],"model":"anthropic/claude-4.5-sonnet-20250929","temperature":0.7,"top\_p":0.9}'

};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"strings"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/responses"

	payload := strings.NewReader("{\\n  \\"input\\": \[\\n    {\\n      \\"type\\": \\"message\\",\\n      \\"role\\": \\"user\\",\\n      \\"content\\": \\"Hello, how are you?\\"\\n    }\\n  \],\\n  \\"tools\\": \[\\n    {\\n      \\"type\\": \\"function\\",\\n      \\"name\\": \\"get\_current\_weather\\",\\n      \\"description\\": \\"Get the current weather in a given location\\",\\n      \\"parameters\\": {\\n        \\"type\\": \\"object\\",\\n        \\"properties\\": {\\n          \\"location\\": {\\n            \\"type\\": \\"string\\"\\n          }\\n        }\\n      }\\n    }\\n  \],\\n  \\"model\\": \\"anthropic/claude-4.5-sonnet-20250929\\",\\n  \\"temperature\\": 0.7,\\n  \\"top\_p\\": 0.9\\n}")

	req, \_ := http.NewRequest("POST", url, payload)

	req.Header.Add("Authorization", "Bearer \<token\>")

	req.Header.Add("Content-Type", "application/json")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/responses")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Post.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

request\["Content-Type"\] \= 'application/json'

request.body \= "{\\n  \\"input\\": \[\\n    {\\n      \\"type\\": \\"message\\",\\n      \\"role\\": \\"user\\",\\n      \\"content\\": \\"Hello, how are you?\\"\\n    }\\n  \],\\n  \\"tools\\": \[\\n    {\\n      \\"type\\": \\"function\\",\\n      \\"name\\": \\"get\_current\_weather\\",\\n      \\"description\\": \\"Get the current weather in a given location\\",\\n      \\"parameters\\": {\\n        \\"type\\": \\"object\\",\\n        \\"properties\\": {\\n          \\"location\\": {\\n            \\"type\\": \\"string\\"\\n          }\\n        }\\n      }\\n    }\\n  \],\\n  \\"model\\": \\"anthropic/claude-4.5-sonnet-20250929\\",\\n  \\"temperature\\": 0.7,\\n  \\"top\_p\\": 0.9\\n}"

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.post("https://openrouter.ai/api/v1/responses")

  .header("Authorization", "Bearer \<token\>")

  .header("Content-Type", "application/json")

  .body("{\\n  \\"input\\": \[\\n    {\\n      \\"type\\": \\"message\\",\\n      \\"role\\": \\"user\\",\\n      \\"content\\": \\"Hello, how are you?\\"\\n    }\\n  \],\\n  \\"tools\\": \[\\n    {\\n      \\"type\\": \\"function\\",\\n      \\"name\\": \\"get\_current\_weather\\",\\n      \\"description\\": \\"Get the current weather in a given location\\",\\n      \\"parameters\\": {\\n        \\"type\\": \\"object\\",\\n        \\"properties\\": {\\n          \\"location\\": {\\n            \\"type\\": \\"string\\"\\n          }\\n        }\\n      }\\n    }\\n  \],\\n  \\"model\\": \\"anthropic/claude-4.5-sonnet-20250929\\",\\n  \\"temperature\\": 0.7,\\n  \\"top\_p\\": 0.9\\n}")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('POST', 'https://openrouter.ai/api/v1/responses', \[

  'body' \=\> '{

  "input": \[

    {

      "type": "message",

      "role": "user",

      "content": "Hello, how are you?"

    }

  \],

  "tools": \[

    {

      "type": "function",

      "name": "get\_current\_weather",

      "description": "Get the current weather in a given location",

      "parameters": {

        "type": "object",

        "properties": {

          "location": {

            "type": "string"

          }

        }

      }

    }

  \],

  "model": "anthropic/claude-4.5-sonnet-20250929",

  "temperature": 0.7,

  "top\_p": 0.9

}',

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

    'Content-Type' \=\> 'application/json',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/responses");

var request \= new RestRequest(Method.POST);

request.AddHeader("Authorization", "Bearer \<token\>");

request.AddHeader("Content-Type", "application/json");

request.AddParameter("application/json", "{\\n  \\"input\\": \[\\n    {\\n      \\"type\\": \\"message\\",\\n      \\"role\\": \\"user\\",\\n      \\"content\\": \\"Hello, how are you?\\"\\n    }\\n  \],\\n  \\"tools\\": \[\\n    {\\n      \\"type\\": \\"function\\",\\n      \\"name\\": \\"get\_current\_weather\\",\\n      \\"description\\": \\"Get the current weather in a given location\\",\\n      \\"parameters\\": {\\n        \\"type\\": \\"object\\",\\n        \\"properties\\": {\\n          \\"location\\": {\\n            \\"type\\": \\"string\\"\\n          }\\n        }\\n      }\\n    }\\n  \],\\n  \\"model\\": \\"anthropic/claude-4.5-sonnet-20250929\\",\\n  \\"temperature\\": 0.7,\\n  \\"top\_p\\": 0.9\\n}", ParameterType.RequestBody);

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \[

  "Authorization": "Bearer \<token\>",

  "Content-Type": "application/json"

\]

let parameters \= \[

  "input": \[

    \[

      "type": "message",

      "role": "user",

      "content": "Hello, how are you?"

    \]

  \],

  "tools": \[

    \[

      "type": "function",

      "name": "get\_current\_weather",

      "description": "Get the current weather in a given location",

      "parameters": \[

        "type": "object",

        "properties": \["location": \["type": "string"\]\]

      \]

    \]

  \],

  "model": "anthropic/claude-4.5-sonnet-20250929",

  "temperature": 0.7,

  "top\_p": 0.9

\] as \[String : Any\]

let postData \= JSONSerialization.data(withJSONObject: parameters, options: \[\])

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/responses")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "POST"

request.allHTTPHeaderFields \= headers

request.httpBody \= postData as Data

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# Get user activity grouped by endpoint

GET [https://openrouter.ai/api/v1/activity](https://openrouter.ai/api/v1/activity)

Returns user activity data grouped by endpoint for the last 30 (completed) UTC days

Reference: [https://openrouter.ai/docs/api/api-reference/analytics/get-user-activity](https://openrouter.ai/docs/api/api-reference/analytics/get-user-activity)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: Get user activity grouped by endpoint

  version: endpoint\_analytics.getUserActivity

paths:

  /activity:

    get:

      operationId: get-user-activity

      summary: Get user activity grouped by endpoint

      description: \>-

        Returns user activity data grouped by endpoint for the last 30

        (completed) UTC days

      tags:

        \- \- subpackage\_analytics

      parameters:

        \- name: date

          in: query

          description: Filter by a single UTC date in the last 30 days (YYYY-MM-DD format).

          required: false

          schema:

            type: string

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Returns user activity data grouped by endpoint

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Analytics\_getUserActivity\_Response\_200'

        '400':

          description: Bad Request \- Invalid date format or date range

          content: {}

        '401':

          description: Unauthorized \- Authentication required or invalid credentials

          content: {}

        '403':

          description: Forbidden \- Only provisioning keys can fetch activity

          content: {}

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

components:

  schemas:

    ActivityItem:

      type: object

      properties:

        date:

          type: string

          description: Date of the activity (YYYY-MM-DD format)

        model:

          type: string

          description: Model slug (e.g., "openai/gpt-4.1")

        model\_permaslug:

          type: string

          description: Model permaslug (e.g., "openai/gpt-4.1-2025-04-14")

        endpoint\_id:

          type: string

          description: Unique identifier for the endpoint

        provider\_name:

          type: string

          description: Name of the provider serving this endpoint

        usage:

          type: number

          format: double

          description: Total cost in USD (OpenRouter credits spent)

        byok\_usage\_inference:

          type: number

          format: double

          description: BYOK inference cost in USD (external credits spent)

        requests:

          type: number

          format: double

          description: Number of requests made

        prompt\_tokens:

          type: number

          format: double

          description: Total prompt tokens used

        completion\_tokens:

          type: number

          format: double

          description: Total completion tokens generated

        reasoning\_tokens:

          type: number

          format: double

          description: Total reasoning tokens used

      required:

        \- date

        \- model

        \- model\_permaslug

        \- endpoint\_id

        \- provider\_name

        \- usage

        \- byok\_usage\_inference

        \- requests

        \- prompt\_tokens

        \- completion\_tokens

        \- reasoning\_tokens

    Analytics\_getUserActivity\_Response\_200:

      type: object

      properties:

        data:

          type: array

          items:

            $ref: '\#/components/schemas/ActivityItem'

          description: List of activity items

      required:

        \- data

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/activity"

headers \= {"Authorization": "Bearer \<token\>"}

response \= requests.get(url, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/activity';

const options \= {method: 'GET', headers: {Authorization: 'Bearer \<token\>'}};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/activity"

	req, \_ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer \<token\>")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/activity")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Get.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.get("https://openrouter.ai/api/v1/activity")

  .header("Authorization", "Bearer \<token\>")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('GET', 'https://openrouter.ai/api/v1/activity', \[

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/activity");

var request \= new RestRequest(Method.GET);

request.AddHeader("Authorization", "Bearer \<token\>");

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \["Authorization": "Bearer \<token\>"\]

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/activity")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "GET"

request.allHTTPHeaderFields \= headers

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# Submit an embedding request

POST [https://openrouter.ai/api/v1/embeddings](https://openrouter.ai/api/v1/embeddings) Content-Type: application/json

Submits an embedding request to the embeddings router

Reference: [https://openrouter.ai/docs/api/api-reference/embeddings/create-embeddings](https://openrouter.ai/docs/api/api-reference/embeddings/create-embeddings)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: Submit an embedding request

  version: endpoint\_embeddings.createEmbeddings

paths:

  /embeddings:

    post:

      operationId: create-embeddings

      summary: Submit an embedding request

      description: Submits an embedding request to the embeddings router

      tags:

        \- \- subpackage\_embeddings

      parameters:

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Embedding response

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Embeddings\_createEmbeddings\_Response\_200'

        '400':

          description: Bad Request \- Invalid request parameters or malformed input

          content: {}

        '401':

          description: Unauthorized \- Authentication required or invalid credentials

          content: {}

        '402':

          description: Payment Required \- Insufficient credits or quota to complete request

          content: {}

        '404':

          description: Not Found \- Resource does not exist

          content: {}

        '429':

          description: Too Many Requests \- Rate limit exceeded

          content: {}

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

        '502':

          description: Bad Gateway \- Provider/upstream API failure

          content: {}

        '503':

          description: Service Unavailable \- Service temporarily unavailable

          content: {}

      requestBody:

        content:

          application/json:

            schema:

              type: object

              properties:

                input:

                  $ref: \>-

                    \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInput

                model:

                  type: string

                encoding\_format:

                  $ref: \>-

                    \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaEncodingFormat

                dimensions:

                  type: integer

                user:

                  type: string

                provider:

                  $ref: '\#/components/schemas/ProviderPreferences'

                input\_type:

                  type: string

              required:

                \- input

                \- model

components:

  schemas:

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItemsOneOf0Type:

      type: string

      enum:

        \- value: text

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItems0:

      type: object

      properties:

        type:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItemsOneOf0Type

        text:

          type: string

      required:

        \- type

        \- text

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItemsOneOf1Type:

      type: string

      enum:

        \- value: image\_url

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItemsOneOf1ImageUrl:

      type: object

      properties:

        url:

          type: string

      required:

        \- url

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItems1:

      type: object

      properties:

        type:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItemsOneOf1Type

        image\_url:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItemsOneOf1ImageUrl

      required:

        \- type

        \- image\_url

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItems:

      oneOf:

        \- $ref: \>-

            \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItems0

        \- $ref: \>-

            \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItems1

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4Items:

      type: object

      properties:

        content:

          type: array

          items:

            $ref: \>-

              \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4ItemsContentItems

      required:

        \- content

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInput4:

      type: array

      items:

        $ref: \>-

          \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInputOneOf4Items

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaInput:

      oneOf:

        \- type: string

        \- type: array

          items:

            type: string

        \- type: array

          items:

            type: number

            format: double

        \- type: array

          items:

            type: array

            items:

              type: number

              format: double

        \- $ref: \>-

            \#/components/schemas/EmbeddingsPostRequestBodyContentApplicationJsonSchemaInput4

    EmbeddingsPostRequestBodyContentApplicationJsonSchemaEncodingFormat:

      type: string

      enum:

        \- value: float

        \- value: base64

    DataCollection:

      type: string

      enum:

        \- value: deny

        \- value: allow

    ProviderName:

      type: string

      enum:

        \- value: AI21

        \- value: AionLabs

        \- value: Alibaba

        \- value: Amazon Bedrock

        \- value: Amazon Nova

        \- value: Anthropic

        \- value: Arcee AI

        \- value: AtlasCloud

        \- value: Avian

        \- value: Azure

        \- value: BaseTen

        \- value: BytePlus

        \- value: Black Forest Labs

        \- value: Cerebras

        \- value: Chutes

        \- value: Cirrascale

        \- value: Clarifai

        \- value: Cloudflare

        \- value: Cohere

        \- value: Crusoe

        \- value: DeepInfra

        \- value: DeepSeek

        \- value: Featherless

        \- value: Fireworks

        \- value: Friendli

        \- value: GMICloud

        \- value: GoPomelo

        \- value: Google

        \- value: Google AI Studio

        \- value: Groq

        \- value: Hyperbolic

        \- value: Inception

        \- value: InferenceNet

        \- value: Infermatic

        \- value: Inflection

        \- value: Liquid

        \- value: Mara

        \- value: Mancer 2

        \- value: Minimax

        \- value: ModelRun

        \- value: Mistral

        \- value: Modular

        \- value: Moonshot AI

        \- value: Morph

        \- value: NCompass

        \- value: Nebius

        \- value: NextBit

        \- value: Novita

        \- value: Nvidia

        \- value: OpenAI

        \- value: OpenInference

        \- value: Parasail

        \- value: Perplexity

        \- value: Phala

        \- value: Relace

        \- value: SambaNova

        \- value: SiliconFlow

        \- value: Sourceful

        \- value: Stealth

        \- value: StreamLake

        \- value: Switchpoint

        \- value: Targon

        \- value: Together

        \- value: Venice

        \- value: WandB

        \- value: Xiaomi

        \- value: xAI

        \- value: Z.AI

        \- value: FakeProvider

    ProviderPreferencesOrderItems:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderName'

        \- type: string

    ProviderPreferencesOnlyItems:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderName'

        \- type: string

    ProviderPreferencesIgnoreItems:

      oneOf:

        \- $ref: '\#/components/schemas/ProviderName'

        \- type: string

    Quantization:

      type: string

      enum:

        \- value: int4

        \- value: int8

        \- value: fp4

        \- value: fp6

        \- value: fp8

        \- value: fp16

        \- value: bf16

        \- value: fp32

        \- value: unknown

    ProviderPreferencesSort:

      type: object

      properties: {}

    BigNumberUnion:

      type: string

    ProviderPreferencesMaxPrice:

      type: object

      properties:

        prompt:

          $ref: '\#/components/schemas/BigNumberUnion'

        completion:

          $ref: '\#/components/schemas/BigNumberUnion'

        image:

          $ref: '\#/components/schemas/BigNumberUnion'

        audio:

          $ref: '\#/components/schemas/BigNumberUnion'

        request:

          $ref: '\#/components/schemas/BigNumberUnion'

    ProviderPreferences:

      type: object

      properties:

        allow\_fallbacks:

          type:

            \- boolean

            \- 'null'

          description: \>

            Whether to allow backup providers to serve requests

            \- true: (default) when the primary provider (or your custom

            providers in "order") is unavailable, use the next best provider.

            \- false: use only the primary/custom provider, and return the

            upstream error if it's unavailable.

        require\_parameters:

          type:

            \- boolean

            \- 'null'

          description: \>-

            Whether to filter providers to only those that support the

            parameters you've provided. If this setting is omitted or set to

            false, then providers will receive only the parameters they support,

            and ignore the rest.

        data\_collection:

          $ref: '\#/components/schemas/DataCollection'

        zdr:

          type:

            \- boolean

            \- 'null'

          description: \>-

            Whether to restrict routing to only ZDR (Zero Data Retention)

            endpoints. When true, only endpoints that do not retain prompts will

            be used.

        enforce\_distillable\_text:

          type:

            \- boolean

            \- 'null'

          description: \>-

            Whether to restrict routing to only models that allow text

            distillation. When true, only models where the author has allowed

            distillation will be used.

        order:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/ProviderPreferencesOrderItems'

          description: \>-

            An ordered list of provider slugs. The router will attempt to use

            the first provider in the subset of this list that supports your

            requested model, and fall back to the next if it is unavailable. If

            no providers are available, the request will fail with an error

            message.

        only:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/ProviderPreferencesOnlyItems'

          description: \>-

            List of provider slugs to allow. If provided, this list is merged

            with your account-wide allowed provider settings for this request.

        ignore:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/ProviderPreferencesIgnoreItems'

          description: \>-

            List of provider slugs to ignore. If provided, this list is merged

            with your account-wide ignored provider settings for this request.

        quantizations:

          type:

            \- array

            \- 'null'

          items:

            $ref: '\#/components/schemas/Quantization'

          description: A list of quantization levels to filter the provider by.

        sort:

          $ref: '\#/components/schemas/ProviderPreferencesSort'

        max\_price:

          $ref: '\#/components/schemas/ProviderPreferencesMaxPrice'

          description: \>-

            The object specifying the maximum price you want to pay for this

            request. USD price per million tokens, for prompt and completion.

        preferred\_min\_throughput:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            Preferred minimum throughput (in tokens per second). Endpoints below

            this threshold may still be used, but are deprioritized in routing.

            When using fallback models, this may cause a fallback model to be

            used instead of the primary model if it meets the threshold.

        preferred\_max\_latency:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            Preferred maximum latency (in seconds). Endpoints above this

            threshold may still be used, but are deprioritized in routing. When

            using fallback models, this may cause a fallback model to be used

            instead of the primary model if it meets the threshold.

        min\_throughput:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            \*\*DEPRECATED\*\* Use preferred\_min\_throughput instead.

            Backwards-compatible alias for preferred\_min\_throughput.

        max\_latency:

          type:

            \- number

            \- 'null'

          format: double

          description: \>-

            \*\*DEPRECATED\*\* Use preferred\_max\_latency instead.

            Backwards-compatible alias for preferred\_max\_latency.

    EmbeddingsPostResponsesContentApplicationJsonSchemaObject:

      type: string

      enum:

        \- value: list

    EmbeddingsPostResponsesContentApplicationJsonSchemaDataItemsObject:

      type: string

      enum:

        \- value: embedding

    EmbeddingsPostResponsesContentApplicationJsonSchemaDataItemsEmbedding:

      oneOf:

        \- type: array

          items:

            type: number

            format: double

        \- type: string

    EmbeddingsPostResponsesContentApplicationJsonSchemaDataItems:

      type: object

      properties:

        object:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostResponsesContentApplicationJsonSchemaDataItemsObject

        embedding:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostResponsesContentApplicationJsonSchemaDataItemsEmbedding

        index:

          type: number

          format: double

      required:

        \- object

        \- embedding

    EmbeddingsPostResponsesContentApplicationJsonSchemaUsage:

      type: object

      properties:

        prompt\_tokens:

          type: number

          format: double

        total\_tokens:

          type: number

          format: double

        cost:

          type: number

          format: double

      required:

        \- prompt\_tokens

        \- total\_tokens

    Embeddings\_createEmbeddings\_Response\_200:

      type: object

      properties:

        id:

          type: string

        object:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostResponsesContentApplicationJsonSchemaObject

        data:

          type: array

          items:

            $ref: \>-

              \#/components/schemas/EmbeddingsPostResponsesContentApplicationJsonSchemaDataItems

        model:

          type: string

        usage:

          $ref: \>-

            \#/components/schemas/EmbeddingsPostResponsesContentApplicationJsonSchemaUsage

      required:

        \- object

        \- data

        \- model

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/embeddings"

payload \= {

    "input": "string",

    "model": "string"

}

headers \= {

    "Authorization": "Bearer \<token\>",

    "Content-Type": "application/json"

}

response \= requests.post(url, json=payload, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/embeddings';

const options \= {

  method: 'POST',

  headers: {Authorization: 'Bearer \<token\>', 'Content-Type': 'application/json'},

  body: '{"input":"string","model":"string"}'

};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"strings"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/embeddings"

	payload := strings.NewReader("{\\n  \\"input\\": \\"string\\",\\n  \\"model\\": \\"string\\"\\n}")

	req, \_ := http.NewRequest("POST", url, payload)

	req.Header.Add("Authorization", "Bearer \<token\>")

	req.Header.Add("Content-Type", "application/json")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/embeddings")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Post.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

request\["Content-Type"\] \= 'application/json'

request.body \= "{\\n  \\"input\\": \\"string\\",\\n  \\"model\\": \\"string\\"\\n}"

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.post("https://openrouter.ai/api/v1/embeddings")

  .header("Authorization", "Bearer \<token\>")

  .header("Content-Type", "application/json")

  .body("{\\n  \\"input\\": \\"string\\",\\n  \\"model\\": \\"string\\"\\n}")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('POST', 'https://openrouter.ai/api/v1/embeddings', \[

  'body' \=\> '{

  "input": "string",

  "model": "string"

}',

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

    'Content-Type' \=\> 'application/json',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/embeddings");

var request \= new RestRequest(Method.POST);

request.AddHeader("Authorization", "Bearer \<token\>");

request.AddHeader("Content-Type", "application/json");

request.AddParameter("application/json", "{\\n  \\"input\\": \\"string\\",\\n  \\"model\\": \\"string\\"\\n}", ParameterType.RequestBody);

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \[

  "Authorization": "Bearer \<token\>",

  "Content-Type": "application/json"

\]

let parameters \= \[

  "input": "string",

  "model": "string"

\] as \[String : Any\]

let postData \= JSONSerialization.data(withJSONObject: parameters, options: \[\])

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/embeddings")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "POST"

request.allHTTPHeaderFields \= headers

request.httpBody \= postData as Data

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# List all embeddings models

GET [https://openrouter.ai/api/v1/embeddings/models](https://openrouter.ai/api/v1/embeddings/models)

Returns a list of all available embeddings models and their properties

Reference: [https://openrouter.ai/docs/api/api-reference/embeddings/list-embeddings-models](https://openrouter.ai/docs/api/api-reference/embeddings/list-embeddings-models)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: List all embeddings models

  version: endpoint\_embeddings.listEmbeddingsModels

paths:

  /embeddings/models:

    get:

      operationId: list-embeddings-models

      summary: List all embeddings models

      description: Returns a list of all available embeddings models and their properties

      tags:

        \- \- subpackage\_embeddings

      parameters:

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Returns a list of embeddings models

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/ModelsListResponse'

        '400':

          description: Bad Request \- Invalid request parameters

          content: {}

        '500':

          description: Internal Server Error

          content: {}

components:

  schemas:

    BigNumberUnion:

      type: string

    PublicPricing:

      type: object

      properties:

        prompt:

          $ref: '\#/components/schemas/BigNumberUnion'

        completion:

          $ref: '\#/components/schemas/BigNumberUnion'

        request:

          $ref: '\#/components/schemas/BigNumberUnion'

        image:

          $ref: '\#/components/schemas/BigNumberUnion'

        image\_token:

          $ref: '\#/components/schemas/BigNumberUnion'

        image\_output:

          $ref: '\#/components/schemas/BigNumberUnion'

        audio:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_audio\_cache:

          $ref: '\#/components/schemas/BigNumberUnion'

        web\_search:

          $ref: '\#/components/schemas/BigNumberUnion'

        internal\_reasoning:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_cache\_read:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_cache\_write:

          $ref: '\#/components/schemas/BigNumberUnion'

        discount:

          type: number

          format: double

      required:

        \- prompt

        \- completion

    ModelGroup:

      type: string

      enum:

        \- value: Router

        \- value: Media

        \- value: Other

        \- value: GPT

        \- value: Claude

        \- value: Gemini

        \- value: Grok

        \- value: Cohere

        \- value: Nova

        \- value: Qwen

        \- value: Yi

        \- value: DeepSeek

        \- value: Mistral

        \- value: Llama2

        \- value: Llama3

        \- value: Llama4

        \- value: PaLM

        \- value: RWKV

        \- value: Qwen3

    ModelArchitectureInstructType:

      type: string

      enum:

        \- value: none

        \- value: airoboros

        \- value: alpaca

        \- value: alpaca-modif

        \- value: chatml

        \- value: claude

        \- value: code-llama

        \- value: gemma

        \- value: llama2

        \- value: llama3

        \- value: mistral

        \- value: nemotron

        \- value: neural

        \- value: openchat

        \- value: phi3

        \- value: rwkv

        \- value: vicuna

        \- value: zephyr

        \- value: deepseek-r1

        \- value: deepseek-v3.1

        \- value: qwq

        \- value: qwen3

    InputModality:

      type: string

      enum:

        \- value: text

        \- value: image

        \- value: file

        \- value: audio

        \- value: video

    OutputModality:

      type: string

      enum:

        \- value: text

        \- value: image

        \- value: embeddings

    ModelArchitecture:

      type: object

      properties:

        tokenizer:

          $ref: '\#/components/schemas/ModelGroup'

        instruct\_type:

          oneOf:

            \- $ref: '\#/components/schemas/ModelArchitectureInstructType'

            \- type: 'null'

          description: Instruction format type

        modality:

          type:

            \- string

            \- 'null'

          description: Primary modality of the model

        input\_modalities:

          type: array

          items:

            $ref: '\#/components/schemas/InputModality'

          description: Supported input modalities

        output\_modalities:

          type: array

          items:

            $ref: '\#/components/schemas/OutputModality'

          description: Supported output modalities

      required:

        \- modality

        \- input\_modalities

        \- output\_modalities

    TopProviderInfo:

      type: object

      properties:

        context\_length:

          type:

            \- number

            \- 'null'

          format: double

          description: Context length from the top provider

        max\_completion\_tokens:

          type:

            \- number

            \- 'null'

          format: double

          description: Maximum completion tokens from the top provider

        is\_moderated:

          type: boolean

          description: Whether the top provider moderates content

      required:

        \- is\_moderated

    PerRequestLimits:

      type: object

      properties:

        prompt\_tokens:

          type: number

          format: double

          description: Maximum prompt tokens per request

        completion\_tokens:

          type: number

          format: double

          description: Maximum completion tokens per request

      required:

        \- prompt\_tokens

        \- completion\_tokens

    Parameter:

      type: string

      enum:

        \- value: temperature

        \- value: top\_p

        \- value: top\_k

        \- value: min\_p

        \- value: top\_a

        \- value: frequency\_penalty

        \- value: presence\_penalty

        \- value: repetition\_penalty

        \- value: max\_tokens

        \- value: logit\_bias

        \- value: logprobs

        \- value: top\_logprobs

        \- value: seed

        \- value: response\_format

        \- value: structured\_outputs

        \- value: stop

        \- value: tools

        \- value: tool\_choice

        \- value: parallel\_tool\_calls

        \- value: include\_reasoning

        \- value: reasoning

        \- value: reasoning\_effort

        \- value: web\_search\_options

        \- value: verbosity

    DefaultParameters:

      type: object

      properties:

        temperature:

          type:

            \- number

            \- 'null'

          format: double

        top\_p:

          type:

            \- number

            \- 'null'

          format: double

        frequency\_penalty:

          type:

            \- number

            \- 'null'

          format: double

    Model:

      type: object

      properties:

        id:

          type: string

          description: Unique identifier for the model

        canonical\_slug:

          type: string

          description: Canonical slug for the model

        hugging\_face\_id:

          type:

            \- string

            \- 'null'

          description: Hugging Face model identifier, if applicable

        name:

          type: string

          description: Display name of the model

        created:

          type: number

          format: double

          description: Unix timestamp of when the model was created

        description:

          type: string

          description: Description of the model

        pricing:

          $ref: '\#/components/schemas/PublicPricing'

        context\_length:

          type:

            \- number

            \- 'null'

          format: double

          description: Maximum context length in tokens

        architecture:

          $ref: '\#/components/schemas/ModelArchitecture'

        top\_provider:

          $ref: '\#/components/schemas/TopProviderInfo'

        per\_request\_limits:

          $ref: '\#/components/schemas/PerRequestLimits'

        supported\_parameters:

          type: array

          items:

            $ref: '\#/components/schemas/Parameter'

          description: List of supported parameters for this model

        default\_parameters:

          $ref: '\#/components/schemas/DefaultParameters'

      required:

        \- id

        \- canonical\_slug

        \- name

        \- created

        \- pricing

        \- context\_length

        \- architecture

        \- top\_provider

        \- per\_request\_limits

        \- supported\_parameters

        \- default\_parameters

    ModelsListResponseData:

      type: array

      items:

        $ref: '\#/components/schemas/Model'

    ModelsListResponse:

      type: object

      properties:

        data:

          $ref: '\#/components/schemas/ModelsListResponseData'

      required:

        \- data

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/embeddings/models"

headers \= {"Authorization": "Bearer \<token\>"}

response \= requests.get(url, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/embeddings/models';

const options \= {method: 'GET', headers: {Authorization: 'Bearer \<token\>'}};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/embeddings/models"

	req, \_ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer \<token\>")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/embeddings/models")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Get.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.get("https://openrouter.ai/api/v1/embeddings/models")

  .header("Authorization", "Bearer \<token\>")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('GET', 'https://openrouter.ai/api/v1/embeddings/models', \[

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/embeddings/models");

var request \= new RestRequest(Method.GET);

request.AddHeader("Authorization", "Bearer \<token\>");

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \["Authorization": "Bearer \<token\>"\]

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/embeddings/models")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "GET"

request.allHTTPHeaderFields \= headers

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# List all endpoints for a model

GET [https://openrouter.ai/api/v1/models/{author}/{slug}/endpoints](https://openrouter.ai/api/v1/models/{author}/{slug}/endpoints)

Reference: [https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: List all endpoints for a model

  version: endpoint\_endpoints.listEndpoints

paths:

  /models/{author}/{slug}/endpoints:

    get:

      operationId: list-endpoints

      summary: List all endpoints for a model

      tags:

        \- \- subpackage\_endpoints

      parameters:

        \- name: author

          in: path

          required: true

          schema:

            type: string

        \- name: slug

          in: path

          required: true

          schema:

            type: string

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Returns a list of endpoints

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Endpoints\_listEndpoints\_Response\_200'

        '404':

          description: Not Found \- Model does not exist

          content: {}

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

components:

  schemas:

    ModelGroup:

      type: string

      enum:

        \- value: Router

        \- value: Media

        \- value: Other

        \- value: GPT

        \- value: Claude

        \- value: Gemini

        \- value: Grok

        \- value: Cohere

        \- value: Nova

        \- value: Qwen

        \- value: Yi

        \- value: DeepSeek

        \- value: Mistral

        \- value: Llama2

        \- value: Llama3

        \- value: Llama4

        \- value: PaLM

        \- value: RWKV

        \- value: Qwen3

    ModelArchitectureInstructType:

      type: string

      enum:

        \- value: none

        \- value: airoboros

        \- value: alpaca

        \- value: alpaca-modif

        \- value: chatml

        \- value: claude

        \- value: code-llama

        \- value: gemma

        \- value: llama2

        \- value: llama3

        \- value: mistral

        \- value: nemotron

        \- value: neural

        \- value: openchat

        \- value: phi3

        \- value: rwkv

        \- value: vicuna

        \- value: zephyr

        \- value: deepseek-r1

        \- value: deepseek-v3.1

        \- value: qwq

        \- value: qwen3

    InputModality:

      type: string

      enum:

        \- value: text

        \- value: image

        \- value: file

        \- value: audio

        \- value: video

    OutputModality:

      type: string

      enum:

        \- value: text

        \- value: image

        \- value: embeddings

    ListEndpointsResponseArchitectureTokenizer:

      type: object

      properties: {}

    InstructType:

      type: string

      enum:

        \- value: none

        \- value: airoboros

        \- value: alpaca

        \- value: alpaca-modif

        \- value: chatml

        \- value: claude

        \- value: code-llama

        \- value: gemma

        \- value: llama2

        \- value: llama3

        \- value: mistral

        \- value: nemotron

        \- value: neural

        \- value: openchat

        \- value: phi3

        \- value: rwkv

        \- value: vicuna

        \- value: zephyr

        \- value: deepseek-r1

        \- value: deepseek-v3.1

        \- value: qwq

        \- value: qwen3

    ListEndpointsResponseArchitecture:

      type: object

      properties:

        tokenizer:

          $ref: '\#/components/schemas/ListEndpointsResponseArchitectureTokenizer'

        instruct\_type:

          $ref: '\#/components/schemas/InstructType'

        modality:

          type:

            \- string

            \- 'null'

          description: Primary modality of the model

        input\_modalities:

          type: array

          items:

            $ref: '\#/components/schemas/InputModality'

          description: Supported input modalities

        output\_modalities:

          type: array

          items:

            $ref: '\#/components/schemas/OutputModality'

          description: Supported output modalities

      required:

        \- modality

        \- input\_modalities

        \- output\_modalities

        \- tokenizer

        \- instruct\_type

    BigNumberUnion:

      type: string

    PublicEndpointPricing:

      type: object

      properties:

        prompt:

          $ref: '\#/components/schemas/BigNumberUnion'

        completion:

          $ref: '\#/components/schemas/BigNumberUnion'

        request:

          $ref: '\#/components/schemas/BigNumberUnion'

        image:

          $ref: '\#/components/schemas/BigNumberUnion'

        image\_token:

          $ref: '\#/components/schemas/BigNumberUnion'

        image\_output:

          $ref: '\#/components/schemas/BigNumberUnion'

        audio:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_audio\_cache:

          $ref: '\#/components/schemas/BigNumberUnion'

        web\_search:

          $ref: '\#/components/schemas/BigNumberUnion'

        internal\_reasoning:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_cache\_read:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_cache\_write:

          $ref: '\#/components/schemas/BigNumberUnion'

        discount:

          type: number

          format: double

      required:

        \- prompt

        \- completion

    ProviderName:

      type: string

      enum:

        \- value: AI21

        \- value: AionLabs

        \- value: Alibaba

        \- value: Amazon Bedrock

        \- value: Amazon Nova

        \- value: Anthropic

        \- value: Arcee AI

        \- value: AtlasCloud

        \- value: Avian

        \- value: Azure

        \- value: BaseTen

        \- value: BytePlus

        \- value: Black Forest Labs

        \- value: Cerebras

        \- value: Chutes

        \- value: Cirrascale

        \- value: Clarifai

        \- value: Cloudflare

        \- value: Cohere

        \- value: Crusoe

        \- value: DeepInfra

        \- value: DeepSeek

        \- value: Featherless

        \- value: Fireworks

        \- value: Friendli

        \- value: GMICloud

        \- value: GoPomelo

        \- value: Google

        \- value: Google AI Studio

        \- value: Groq

        \- value: Hyperbolic

        \- value: Inception

        \- value: InferenceNet

        \- value: Infermatic

        \- value: Inflection

        \- value: Liquid

        \- value: Mara

        \- value: Mancer 2

        \- value: Minimax

        \- value: ModelRun

        \- value: Mistral

        \- value: Modular

        \- value: Moonshot AI

        \- value: Morph

        \- value: NCompass

        \- value: Nebius

        \- value: NextBit

        \- value: Novita

        \- value: Nvidia

        \- value: OpenAI

        \- value: OpenInference

        \- value: Parasail

        \- value: Perplexity

        \- value: Phala

        \- value: Relace

        \- value: SambaNova

        \- value: SiliconFlow

        \- value: Sourceful

        \- value: Stealth

        \- value: StreamLake

        \- value: Switchpoint

        \- value: Targon

        \- value: Together

        \- value: Venice

        \- value: WandB

        \- value: Xiaomi

        \- value: xAI

        \- value: Z.AI

        \- value: FakeProvider

    PublicEndpointQuantization:

      type: object

      properties: {}

    Parameter:

      type: string

      enum:

        \- value: temperature

        \- value: top\_p

        \- value: top\_k

        \- value: min\_p

        \- value: top\_a

        \- value: frequency\_penalty

        \- value: presence\_penalty

        \- value: repetition\_penalty

        \- value: max\_tokens

        \- value: logit\_bias

        \- value: logprobs

        \- value: top\_logprobs

        \- value: seed

        \- value: response\_format

        \- value: structured\_outputs

        \- value: stop

        \- value: tools

        \- value: tool\_choice

        \- value: parallel\_tool\_calls

        \- value: include\_reasoning

        \- value: reasoning

        \- value: reasoning\_effort

        \- value: web\_search\_options

        \- value: verbosity

    EndpointStatus:

      type: string

      enum:

        \- value: '0'

        \- value: '-1'

        \- value: '-2'

        \- value: '-3'

        \- value: '-5'

        \- value: '-10'

    PublicEndpoint:

      type: object

      properties:

        name:

          type: string

        model\_name:

          type: string

        context\_length:

          type: number

          format: double

        pricing:

          $ref: '\#/components/schemas/PublicEndpointPricing'

        provider\_name:

          $ref: '\#/components/schemas/ProviderName'

        tag:

          type: string

        quantization:

          $ref: '\#/components/schemas/PublicEndpointQuantization'

        max\_completion\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        max\_prompt\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        supported\_parameters:

          type: array

          items:

            $ref: '\#/components/schemas/Parameter'

        status:

          $ref: '\#/components/schemas/EndpointStatus'

        uptime\_last\_30m:

          type:

            \- number

            \- 'null'

          format: double

        supports\_implicit\_caching:

          type: boolean

      required:

        \- name

        \- model\_name

        \- context\_length

        \- pricing

        \- provider\_name

        \- tag

        \- quantization

        \- max\_completion\_tokens

        \- max\_prompt\_tokens

        \- supported\_parameters

        \- uptime\_last\_30m

        \- supports\_implicit\_caching

    ListEndpointsResponse:

      type: object

      properties:

        id:

          type: string

          description: Unique identifier for the model

        name:

          type: string

          description: Display name of the model

        created:

          type: number

          format: double

          description: Unix timestamp of when the model was created

        description:

          type: string

          description: Description of the model

        architecture:

          $ref: '\#/components/schemas/ListEndpointsResponseArchitecture'

        endpoints:

          type: array

          items:

            $ref: '\#/components/schemas/PublicEndpoint'

          description: List of available endpoints for this model

      required:

        \- id

        \- name

        \- created

        \- description

        \- architecture

        \- endpoints

    Endpoints\_listEndpoints\_Response\_200:

      type: object

      properties:

        data:

          $ref: '\#/components/schemas/ListEndpointsResponse'

      required:

        \- data

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/models/author/slug/endpoints"

headers \= {"Authorization": "Bearer \<token\>"}

response \= requests.get(url, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/models/author/slug/endpoints';

const options \= {method: 'GET', headers: {Authorization: 'Bearer \<token\>'}};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/models/author/slug/endpoints"

	req, \_ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer \<token\>")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/models/author/slug/endpoints")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Get.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.get("https://openrouter.ai/api/v1/models/author/slug/endpoints")

  .header("Authorization", "Bearer \<token\>")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('GET', 'https://openrouter.ai/api/v1/models/author/slug/endpoints', \[

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/models/author/slug/endpoints");

var request \= new RestRequest(Method.GET);

request.AddHeader("Authorization", "Bearer \<token\>");

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \["Authorization": "Bearer \<token\>"\]

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/models/author/slug/endpoints")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "GET"

request.allHTTPHeaderFields \= headers

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# Preview the impact of ZDR on the available endpoints

GET [https://openrouter.ai/api/v1/endpoints/zdr](https://openrouter.ai/api/v1/endpoints/zdr)

Reference: [https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints-zdr](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints-zdr)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: Preview the impact of ZDR on the available endpoints

  version: endpoint\_endpoints.listEndpointsZdr

paths:

  /endpoints/zdr:

    get:

      operationId: list-endpoints-zdr

      summary: Preview the impact of ZDR on the available endpoints

      tags:

        \- \- subpackage\_endpoints

      parameters:

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Returns a list of endpoints

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Endpoints\_listEndpointsZdr\_Response\_200'

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

components:

  schemas:

    BigNumberUnion:

      type: string

    PublicEndpointPricing:

      type: object

      properties:

        prompt:

          $ref: '\#/components/schemas/BigNumberUnion'

        completion:

          $ref: '\#/components/schemas/BigNumberUnion'

        request:

          $ref: '\#/components/schemas/BigNumberUnion'

        image:

          $ref: '\#/components/schemas/BigNumberUnion'

        image\_token:

          $ref: '\#/components/schemas/BigNumberUnion'

        image\_output:

          $ref: '\#/components/schemas/BigNumberUnion'

        audio:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_audio\_cache:

          $ref: '\#/components/schemas/BigNumberUnion'

        web\_search:

          $ref: '\#/components/schemas/BigNumberUnion'

        internal\_reasoning:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_cache\_read:

          $ref: '\#/components/schemas/BigNumberUnion'

        input\_cache\_write:

          $ref: '\#/components/schemas/BigNumberUnion'

        discount:

          type: number

          format: double

      required:

        \- prompt

        \- completion

    ProviderName:

      type: string

      enum:

        \- value: AI21

        \- value: AionLabs

        \- value: Alibaba

        \- value: Amazon Bedrock

        \- value: Amazon Nova

        \- value: Anthropic

        \- value: Arcee AI

        \- value: AtlasCloud

        \- value: Avian

        \- value: Azure

        \- value: BaseTen

        \- value: BytePlus

        \- value: Black Forest Labs

        \- value: Cerebras

        \- value: Chutes

        \- value: Cirrascale

        \- value: Clarifai

        \- value: Cloudflare

        \- value: Cohere

        \- value: Crusoe

        \- value: DeepInfra

        \- value: DeepSeek

        \- value: Featherless

        \- value: Fireworks

        \- value: Friendli

        \- value: GMICloud

        \- value: GoPomelo

        \- value: Google

        \- value: Google AI Studio

        \- value: Groq

        \- value: Hyperbolic

        \- value: Inception

        \- value: InferenceNet

        \- value: Infermatic

        \- value: Inflection

        \- value: Liquid

        \- value: Mara

        \- value: Mancer 2

        \- value: Minimax

        \- value: ModelRun

        \- value: Mistral

        \- value: Modular

        \- value: Moonshot AI

        \- value: Morph

        \- value: NCompass

        \- value: Nebius

        \- value: NextBit

        \- value: Novita

        \- value: Nvidia

        \- value: OpenAI

        \- value: OpenInference

        \- value: Parasail

        \- value: Perplexity

        \- value: Phala

        \- value: Relace

        \- value: SambaNova

        \- value: SiliconFlow

        \- value: Sourceful

        \- value: Stealth

        \- value: StreamLake

        \- value: Switchpoint

        \- value: Targon

        \- value: Together

        \- value: Venice

        \- value: WandB

        \- value: Xiaomi

        \- value: xAI

        \- value: Z.AI

        \- value: FakeProvider

    PublicEndpointQuantization:

      type: object

      properties: {}

    Parameter:

      type: string

      enum:

        \- value: temperature

        \- value: top\_p

        \- value: top\_k

        \- value: min\_p

        \- value: top\_a

        \- value: frequency\_penalty

        \- value: presence\_penalty

        \- value: repetition\_penalty

        \- value: max\_tokens

        \- value: logit\_bias

        \- value: logprobs

        \- value: top\_logprobs

        \- value: seed

        \- value: response\_format

        \- value: structured\_outputs

        \- value: stop

        \- value: tools

        \- value: tool\_choice

        \- value: parallel\_tool\_calls

        \- value: include\_reasoning

        \- value: reasoning

        \- value: reasoning\_effort

        \- value: web\_search\_options

        \- value: verbosity

    EndpointStatus:

      type: string

      enum:

        \- value: '0'

        \- value: '-1'

        \- value: '-2'

        \- value: '-3'

        \- value: '-5'

        \- value: '-10'

    PublicEndpoint:

      type: object

      properties:

        name:

          type: string

        model\_name:

          type: string

        context\_length:

          type: number

          format: double

        pricing:

          $ref: '\#/components/schemas/PublicEndpointPricing'

        provider\_name:

          $ref: '\#/components/schemas/ProviderName'

        tag:

          type: string

        quantization:

          $ref: '\#/components/schemas/PublicEndpointQuantization'

        max\_completion\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        max\_prompt\_tokens:

          type:

            \- number

            \- 'null'

          format: double

        supported\_parameters:

          type: array

          items:

            $ref: '\#/components/schemas/Parameter'

        status:

          $ref: '\#/components/schemas/EndpointStatus'

        uptime\_last\_30m:

          type:

            \- number

            \- 'null'

          format: double

        supports\_implicit\_caching:

          type: boolean

      required:

        \- name

        \- model\_name

        \- context\_length

        \- pricing

        \- provider\_name

        \- tag

        \- quantization

        \- max\_completion\_tokens

        \- max\_prompt\_tokens

        \- supported\_parameters

        \- uptime\_last\_30m

        \- supports\_implicit\_caching

    Endpoints\_listEndpointsZdr\_Response\_200:

      type: object

      properties:

        data:

          type: array

          items:

            $ref: '\#/components/schemas/PublicEndpoint'

      required:

        \- data

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/endpoints/zdr"

headers \= {"Authorization": "Bearer \<token\>"}

response \= requests.get(url, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/endpoints/zdr';

const options \= {method: 'GET', headers: {Authorization: 'Bearer \<token\>'}};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/endpoints/zdr"

	req, \_ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer \<token\>")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/endpoints/zdr")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Get.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.get("https://openrouter.ai/api/v1/endpoints/zdr")

  .header("Authorization", "Bearer \<token\>")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('GET', 'https://openrouter.ai/api/v1/endpoints/zdr', \[

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/endpoints/zdr");

var request \= new RestRequest(Method.GET);

request.AddHeader("Authorization", "Bearer \<token\>");

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \["Authorization": "Bearer \<token\>"\]

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/endpoints/zdr")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "GET"

request.allHTTPHeaderFields \= headers

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# Get a model's supported parameters and data about which are most popular

GET [https://openrouter.ai/api/v1/parameters/{author}/{slug}](https://openrouter.ai/api/v1/parameters/{author}/{slug})

Reference: [https://openrouter.ai/docs/api/api-reference/parameters/get-parameters](https://openrouter.ai/docs/api/api-reference/parameters/get-parameters)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: Get a model's supported parameters and data about which are most popular

  version: endpoint\_parameters.getParameters

paths:

  /parameters/{author}/{slug}:

    get:

      operationId: get-parameters

      summary: Get a model's supported parameters and data about which are most popular

      tags:

        \- \- subpackage\_parameters

      parameters:

        \- name: author

          in: path

          required: true

          schema:

            type: string

        \- name: slug

          in: path

          required: true

          schema:

            type: string

        \- name: provider

          in: query

          required: false

          schema:

            $ref: '\#/components/schemas/ProviderName'

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Returns the parameters for the specified model

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Parameters\_getParameters\_Response\_200'

        '401':

          description: Unauthorized \- Authentication required or invalid credentials

          content: {}

        '404':

          description: Not Found \- Model or provider does not exist

          content: {}

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

components:

  schemas:

    ProviderName:

      type: string

      enum:

        \- value: AI21

        \- value: AionLabs

        \- value: Alibaba

        \- value: Amazon Bedrock

        \- value: Amazon Nova

        \- value: Anthropic

        \- value: Arcee AI

        \- value: AtlasCloud

        \- value: Avian

        \- value: Azure

        \- value: BaseTen

        \- value: BytePlus

        \- value: Black Forest Labs

        \- value: Cerebras

        \- value: Chutes

        \- value: Cirrascale

        \- value: Clarifai

        \- value: Cloudflare

        \- value: Cohere

        \- value: Crusoe

        \- value: DeepInfra

        \- value: DeepSeek

        \- value: Featherless

        \- value: Fireworks

        \- value: Friendli

        \- value: GMICloud

        \- value: GoPomelo

        \- value: Google

        \- value: Google AI Studio

        \- value: Groq

        \- value: Hyperbolic

        \- value: Inception

        \- value: InferenceNet

        \- value: Infermatic

        \- value: Inflection

        \- value: Liquid

        \- value: Mara

        \- value: Mancer 2

        \- value: Minimax

        \- value: ModelRun

        \- value: Mistral

        \- value: Modular

        \- value: Moonshot AI

        \- value: Morph

        \- value: NCompass

        \- value: Nebius

        \- value: NextBit

        \- value: Novita

        \- value: Nvidia

        \- value: OpenAI

        \- value: OpenInference

        \- value: Parasail

        \- value: Perplexity

        \- value: Phala

        \- value: Relace

        \- value: SambaNova

        \- value: SiliconFlow

        \- value: Sourceful

        \- value: Stealth

        \- value: StreamLake

        \- value: Switchpoint

        \- value: Targon

        \- value: Together

        \- value: Venice

        \- value: WandB

        \- value: Xiaomi

        \- value: xAI

        \- value: Z.AI

        \- value: FakeProvider

    ParametersAuthorSlugGetResponsesContentApplicationJsonSchemaDataSupportedParametersItems:

      type: string

      enum:

        \- value: temperature

        \- value: top\_p

        \- value: top\_k

        \- value: min\_p

        \- value: top\_a

        \- value: frequency\_penalty

        \- value: presence\_penalty

        \- value: repetition\_penalty

        \- value: max\_tokens

        \- value: logit\_bias

        \- value: logprobs

        \- value: top\_logprobs

        \- value: seed

        \- value: response\_format

        \- value: structured\_outputs

        \- value: stop

        \- value: tools

        \- value: tool\_choice

        \- value: parallel\_tool\_calls

        \- value: include\_reasoning

        \- value: reasoning

        \- value: reasoning\_effort

        \- value: web\_search\_options

        \- value: verbosity

    ParametersAuthorSlugGetResponsesContentApplicationJsonSchemaData:

      type: object

      properties:

        model:

          type: string

          description: Model identifier

        supported\_parameters:

          type: array

          items:

            $ref: \>-

              \#/components/schemas/ParametersAuthorSlugGetResponsesContentApplicationJsonSchemaDataSupportedParametersItems

          description: List of parameters supported by this model

      required:

        \- model

        \- supported\_parameters

    Parameters\_getParameters\_Response\_200:

      type: object

      properties:

        data:

          $ref: \>-

            \#/components/schemas/ParametersAuthorSlugGetResponsesContentApplicationJsonSchemaData

          description: Parameter analytics data

      required:

        \- data

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/parameters/author/slug"

headers \= {"Authorization": "Bearer \<token\>"}

response \= requests.get(url, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/parameters/author/slug';

const options \= {method: 'GET', headers: {Authorization: 'Bearer \<token\>'}};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/parameters/author/slug"

	req, \_ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer \<token\>")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/parameters/author/slug")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Get.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.get("https://openrouter.ai/api/v1/parameters/author/slug")

  .header("Authorization", "Bearer \<token\>")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('GET', 'https://openrouter.ai/api/v1/parameters/author/slug', \[

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/parameters/author/slug");

var request \= new RestRequest(Method.GET);

request.AddHeader("Authorization", "Bearer \<token\>");

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \["Authorization": "Bearer \<token\>"\]

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/parameters/author/slug")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "GET"

request.allHTTPHeaderFields \= headers

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

# List all providers

GET [https://openrouter.ai/api/v1/providers](https://openrouter.ai/api/v1/providers)

Reference: [https://openrouter.ai/docs/api/api-reference/providers/list-providers](https://openrouter.ai/docs/api/api-reference/providers/list-providers)

## OpenAPI Specification

openapi: 3.1.1

info:

  title: List all providers

  version: endpoint\_providers.listProviders

paths:

  /providers:

    get:

      operationId: list-providers

      summary: List all providers

      tags:

        \- \- subpackage\_providers

      parameters:

        \- name: Authorization

          in: header

          description: API key as bearer token in Authorization header

          required: true

          schema:

            type: string

      responses:

        '200':

          description: Returns a list of providers

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Providers\_listProviders\_Response\_200'

        '500':

          description: Internal Server Error \- Unexpected server error

          content: {}

components:

  schemas:

    ProvidersGetResponsesContentApplicationJsonSchemaDataItems:

      type: object

      properties:

        name:

          type: string

          description: Display name of the provider

        slug:

          type: string

          description: URL-friendly identifier for the provider

        privacy\_policy\_url:

          type:

            \- string

            \- 'null'

          description: URL to the provider's privacy policy

        terms\_of\_service\_url:

          type:

            \- string

            \- 'null'

          description: URL to the provider's terms of service

        status\_page\_url:

          type:

            \- string

            \- 'null'

          description: URL to the provider's status page

      required:

        \- name

        \- slug

        \- privacy\_policy\_url

    Providers\_listProviders\_Response\_200:

      type: object

      properties:

        data:

          type: array

          items:

            $ref: \>-

              \#/components/schemas/ProvidersGetResponsesContentApplicationJsonSchemaDataItems

      required:

        \- data

## SDK Code Examples

import requests

url \= "https://openrouter.ai/api/v1/providers"

headers \= {"Authorization": "Bearer \<token\>"}

response \= requests.get(url, headers=headers)

print(response.json())

const url \= 'https://openrouter.ai/api/v1/providers';

const options \= {method: 'GET', headers: {Authorization: 'Bearer \<token\>'}};

try {

  const response \= await fetch(url, options);

  const data \= await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}

package main

import (

	"fmt"

	"net/http"

	"io"

)

func main() {

	url := "https://openrouter.ai/api/v1/providers"

	req, \_ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer \<token\>")

	res, \_ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	body, \_ := io.ReadAll(res.Body)

	fmt.Println(res)

	fmt.Println(string(body))

}

require 'uri'

require 'net/http'

url \= URI("https://openrouter.ai/api/v1/providers")

http \= Net::HTTP.new(url.host, url.port)

http.use\_ssl \= true

request \= Net::HTTP::Get.new(url)

request\["Authorization"\] \= 'Bearer \<token\>'

response \= http.request(request)

puts response.read\_body

HttpResponse\<String\> response \= Unirest.get("https://openrouter.ai/api/v1/providers")

  .header("Authorization", "Bearer \<token\>")

  .asString();

\<?php

$client \= new \\GuzzleHttp\\Client();

$response \= $client-\>request('GET', 'https://openrouter.ai/api/v1/providers', \[

  'headers' \=\> \[

    'Authorization' \=\> 'Bearer \<token\>',

  \],

\]);

echo $response-\>getBody();

var client \= new RestClient("https://openrouter.ai/api/v1/providers");

var request \= new RestRequest(Method.GET);

request.AddHeader("Authorization", "Bearer \<token\>");

IRestResponse response \= client.Execute(request);

import Foundation

let headers \= \["Authorization": "Bearer \<token\>"\]

let request \= NSMutableURLRequest(url: NSURL(string: "https://openrouter.ai/api/v1/providers")\! as URL,

                                        cachePolicy: .useProtocolCachePolicy,

                                    timeoutInterval: 10.0)

request.httpMethod \= "GET"

request.allHTTPHeaderFields \= headers

let session \= URLSession.shared

let dataTask \= session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) \-\> Void in

  if (error \!= nil) {

    print(error as Any)

  } else {

    let httpResponse \= response as? HTTPURLResponse

    print(httpResponse)

  }

})

dataTask.resume()

---
title: Python SDK
subtitle: Official OpenRouter Python SDK documentation
headline: OpenRouter Python SDK | Complete Documentation
canonical-url: 'https://openrouter.ai/docs/sdks/python'
'og:site_name': OpenRouter Documentation
'og:title': OpenRouter Python SDK | Complete Documentation
'og:description': >-
  Complete guide to using the OpenRouter Python SDK. Learn how to integrate AI
  models into your Python applications.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Python%20SDK&description=Official%20OpenRouter%20Python%20SDK%20documentation
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

{/* banner:start */}
<Warning>
The Python SDK and docs are currently in beta.
Report issues on [GitHub](https://github.com/OpenRouterTeam/python-sdk/issues).
</Warning>
{/* banner:end */}

The OpenRouter Python SDK is a type-safe toolkit for building AI applications with access to 300+ language models through a unified API.

## Why use the OpenRouter SDK?

Integrating AI models into applications involves handling different provider APIs, managing model-specific requirements, and avoiding common implementation mistakes. The OpenRouter SDK standardizes these integrations and protects you from footguns.

```python
from openrouter import OpenRouter
import os

with OpenRouter(
    api_key=os.getenv("OPENROUTER_API_KEY")
) as client:
    response = client.chat.send(
        model="minimax/minimax-m2",
        messages=[
            {"role": "user", "content": "Explain quantum computing"}
        ]
    )
```

The SDK provides three core benefits:

### Auto-generated from API specifications

The SDK is automatically generated from OpenRouter's OpenAPI specs and updated with every API change. New models, parameters, and features appear in your IDE autocomplete immediately. No manual updates. No version drift.

```python
# When new models launch, they're available instantly
response = client.chat.send(
    model="minimax/minimax-m2"
)
```

### Type-safe by default

Every parameter, response field, and configuration option is fully typed with Python type hints and validated with Pydantic. Invalid configurations are caught at runtime with clear error messages.

```python
response = client.chat.send(
    model="minimax/minimax-m2",
    messages=[
        {"role": "user", "content": "Hello"}
        # ← Pydantic validates message structure
    ],
    temperature=0.7,  # ← Type-checked and validated
    stream=True       # ← Response type changes based on this
)
```

**Actionable error messages:**

```python
# Instead of generic errors, get specific guidance:
# "Model 'openai/o1-preview' requires at least 2 messages.
#  You provided 1 message. Add a system or user message."
```

**Type-safe streaming:**

```python
stream = client.chat.send(
    model="minimax/minimax-m2",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True
)

for event in stream:
    # Full type information for streaming responses
    content = event.choices[0].delta.content if event.choices else None
```

**Async support:**

```python
import asyncio

async def main():
    async with OpenRouter(
        api_key=os.getenv("OPENROUTER_API_KEY")
    ) as client:
        response = await client.chat.send_async(
            model="minimax/minimax-m2",
            messages=[{"role": "user", "content": "Hello"}]
        )
        print(response.choices[0].message.content)

asyncio.run(main())
```

## Installation

```bash
# Using uv (recommended)
uv add openrouter

# Using pip
pip install openrouter

# Using poetry
poetry add openrouter
```

**Requirements:** Python 3.9 or higher

Get your API key from [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).

## Quick start

```python
from openrouter import OpenRouter
import os

with OpenRouter(
    api_key=os.getenv("OPENROUTER_API_KEY")
) as client:
    response = client.chat.send(
        model="minimax/minimax-m2",
        messages=[
            {"role": "user", "content": "Hello!"}
        ]
    )

    print(response.choices[0].message.content)
```



---
title: Using MCP Servers with OpenRouter
subtitle: Use MCP Servers with OpenRouter
headline: Using MCP Servers with OpenRouter
canonical-url: 'https://openrouter.ai/docs/guides/guides/mcp-servers'
'og:site_name': OpenRouter Documentation
'og:title': Using MCP Servers with OpenRouter
'og:description': Learn how to use MCP Servers with OpenRouter
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Using%20MCP%20Servers%20with%20OpenRouter&description=Learn%20how%20to%20use%20MCP%20Servers%20with%20OpenRouter
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

MCP servers are a popular way of providing LLMs with tool calling abilities, and are an alternative to using OpenAI-compatible tool calling.

By converting MCP (Anthropic) tool definitions to OpenAI-compatible tool definitions, you can use MCP servers with OpenRouter.

In this example, we'll use [Anthropic's MCP client SDK](https://github.com/modelcontextprotocol/python-sdk?tab=readme-ov-file#writing-mcp-clients) to interact with the File System MCP, all with OpenRouter under the hood.

<Warning>
  Note that interacting with MCP servers is more complex than calling a REST
  endpoint. The MCP protocol is stateful and requires session management. The
  example below uses the MCP client SDK, but is still somewhat complex.
</Warning>

First, some setup. In order to run this you will need to pip install the packages, and create a `.env` file with OPENAI_API_KEY set. This example also assumes the directory `/Applications` exists.

```python
import asyncio
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()  # load environment variables from .env

MODEL = "anthropic/claude-3-7-sonnet"

SERVER_CONFIG = {
    "command": "npx",
    "args": ["-y",
              "@modelcontextprotocol/server-filesystem",
              f"/Applications/"],
    "env": None
}
```

Next, our helper function to convert MCP tool definitions to OpenAI tool definitions:

```python

def convert_tool_format(tool):
    converted_tool = {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": {
                "type": "object",
                "properties": tool.inputSchema["properties"],
                "required": tool.inputSchema["required"]
            }
        }
    }
    return converted_tool

```

And, the MCP client itself; a regrettable ~100 lines of code. Note that the SERVER_CONFIG is hard-coded into the client, but of course could be parameterized for other MCP servers.

```python
class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.openai = OpenAI(
            base_url="https://openrouter.ai/api/v1"
        )

    async def connect_to_server(self, server_config):
        server_params = StdioServerParameters(**server_config)
        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

        await self.session.initialize()

        # List available tools from the MCP server
        response = await self.session.list_tools()
        print("\nConnected to server with tools:", [tool.name for tool in response.tools])

        self.messages = []

    async def process_query(self, query: str) -> str:

        self.messages.append({
            "role": "user",
            "content": query
        })

        response = await self.session.list_tools()
        available_tools = [convert_tool_format(tool) for tool in response.tools]

        response = self.openai.chat.completions.create(
            model=MODEL,
            tools=available_tools,
            messages=self.messages
        )
        self.messages.append(response.choices[0].message.model_dump())

        final_text = []
        content = response.choices[0].message
        if content.tool_calls is not None:
            tool_name = content.tool_calls[0].function.name
            tool_args = content.tool_calls[0].function.arguments
            tool_args = json.loads(tool_args) if tool_args else {}

            # Execute tool call
            try:
                result = await self.session.call_tool(tool_name, tool_args)
                final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")
            except Exception as e:
                print(f"Error calling tool {tool_name}: {e}")
                result = None

            self.messages.append({
                "role": "tool",
                "tool_call_id": content.tool_calls[0].id,
                "name": tool_name,
                "content": result.content
            })

            response = self.openai.chat.completions.create(
                model=MODEL,
                max_tokens=1000,
                messages=self.messages,
            )

            final_text.append(response.choices[0].message.content)
        else:
            final_text.append(content.content)

        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        while True:
            try:
                query = input("\nQuery: ").strip()
                result = await self.process_query(query)
                print("Result:")
                print(result)

            except Exception as e:
                print(f"Error: {str(e)}")

    async def cleanup(self):
        await self.exit_stack.aclose()

async def main():
    client = MCPClient()
    try:
        await client.connect_to_server(SERVER_CONFIG)
        await client.chat_loop()
    finally:
        await client.cleanup()

if __name__ == "__main__":
    import sys
    asyncio.run(main())
```

Assembling all of the above code into mcp-client.py, you get a client that behaves as follows (some outputs truncated for brevity):

```bash
% python mcp-client.py

Secure MCP Filesystem Server running on stdio
Allowed directories: [ '/Applications' ]

Connected to server with tools: ['read_file', 'read_multiple_files', 'write_file'...]

MCP Client Started!
Type your queries or 'quit' to exit.

Query: Do I have microsoft office installed?

Result:
[Calling tool list_allowed_directories with args {}]
I can check if Microsoft Office is installed in the Applications folder:

Query: continue

Result:
[Calling tool search_files with args {'path': '/Applications', 'pattern': 'Microsoft'}]
Now let me check specifically for Microsoft Office applications:

Query: continue

Result:
I can see from the search results that Microsoft Office is indeed installed on your system.
The search found the following main Microsoft Office applications:

1. Microsoft Excel - /Applications/Microsoft Excel.app
2. Microsoft PowerPoint - /Applications/Microsoft PowerPoint.app
3. Microsoft Word - /Applications/Microsoft Word.app
4. OneDrive - /Applications/OneDrive.app (which includes Microsoft SharePoint integration)
```
