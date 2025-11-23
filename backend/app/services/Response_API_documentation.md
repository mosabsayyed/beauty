---
description: Learn how to use the OpenAI-compatible Responses API with Groq, including built-in tools, tool use examples, and supported features.
title: Responses API - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Responses API

Groq's Responses API is fully compatible with OpenAI's Responses API, making it easy to integrate advanced conversational AI capabilities into your applications. The Responses API supports both text and image inputs while producing text outputs, stateful conversations, and function calling to connect with external systems.

The Responses API is currently in beta. Please let us know your feedback in our [Community](https://community.groq.com).

## [Configuring OpenAI Client for Responses API](#configuring-openai-client-for-responses-api)

To use the Responses API with OpenAI's client libraries, configure your client with your Groq API key and set the base URL to `https://api.groq.com/openai/v1`:

javascript

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-20b",
  input: "Tell me a fun fact about the moon in one sentence.",
});

console.log(response.output_text);
```

```
import openai

client = openai.OpenAI(
    api_key="your-groq-api-key",
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="llama-3.3-70b-versatile",
    input="Tell me a fun fact about the moon in one sentence.",
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "input": "Tell me a fun fact about the moon in one sentence."
  }'
```

You can find your API key [here](https://console.groq.com/keys).

## [Multi-turn Conversations](#multiturn-conversations)

The Responses API on Groq doesn't support stateful conversations yet, so you'll need to keep track of the conversation history yourself and provide it in every request.

javascript

```
import OpenAI from "openai";
import * as readline from "readline";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askQuestion(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

const messages = [];

async function main() {
    while (true) {
        const userInput = await askQuestion("You: ");

        if (userInput.toLowerCase().trim() === "stop") {
            console.log("Goodbye!");
            rl.close();
            break;
        }

        messages.push({
            role: "user",
            content: userInput,
        });

        const response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: messages,
        });

        const assistantMessage = response.output_text;
        messages.push(...response.output);

        console.log(`Assistant: ${assistantMessage}`);
    }
}

main();
```

```
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

messages = []


def main():
    while True:
        user_input = input("You: ")

        if user_input.lower().strip() == "stop":
            print("Goodbye!")
            break

        messages.append({
            "role": "user",
            "content": user_input,
        })

        response = client.responses.create(
            model="openai/gpt-oss-20b",
            input=messages,
        )

        assistant_message = response.output_text
        messages.extend(response.output)

        print(f"Assistant: {assistant_message}")


if __name__ == "__main__":
    main()
```

## [Image Inputs](#image-inputs)

The Responses API supports image inputs with all [vision-capable models](https://console.groq.com/docs/vision). Here's an example of how to pass an image to the model:

javascript

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  input: [
    {
      role: "user",
      content: [
        {
            type: "input_text",
            text: "What are the main colors in this image? Give me the hex code for each color in a list."
        },
        {
            type: "input_image",
            detail: "auto",
            image_url: "https://console.groq.com/og_cloud.png"
        }
      ]
    }
  ],
});

console.log(response.output_text);
```

```
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

response = client.responses.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "What are the main colors in this image? Give me the hex code for each color in a list."
                },
                {
                    "type": "input_image",
                    "detail": "auto",
                    "image_url": "https://console.groq.com/og_cloud.png"
                }
            ]
        }
    ],
)

print(response.output_text)
```

```
curl -X POST https://api.groq.com/openai/v1/responses \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
    "input": [
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": "What are the main colors in this image? Give me the hex code for each color in a list."
          },
          {
            "type": "input_image",
            "detail": "auto",
            "image_url": "https://console.groq.com/og_cloud.png"
          }
        ]
      }
    ]
  }'
```

## [Built-In Tools](#builtin-tools)

In addition to a model's regular [tool use capabilities](https://console.groq.com/docs/tool-use), the Responses API supports various built-in tools to extend your model's capabilities.

### [Model Support](#model-support)

While all models support the Responses API, these built-in tools are only supported for the following models:

| Model ID                                               | Browser Search | Code Execution |
| ------------------------------------------------------ | -------------- | -------------- |
| [openai/gpt-oss-20b](https://console.groq.com/docs/model/openai/gpt-oss-20b)   | ✅              | ✅              |
| [openai/gpt-oss-120b](https://console.groq.com/docs/model/openai/gpt-oss-120b) | ✅              | ✅              |

Here are examples using code execution and browser search:

### [Code Execution Example](#code-execution-example)

Enable your models to write and execute Python code for calculations, data analysis, and problem-solving - see our [code execution documentation](https://console.groq.com/docs/code-execution) for more details.

javascript

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-20b",
  input: "What is 1312 X 3333? Output only the final answer.",
  tool_choice: "required",
  tools: [
    {
      type: "code_interpreter",
      container: {
        "type": "auto"
      }
    }
  ]
});

console.log(response.output_text);
```

```
import openai

client = openai.OpenAI(
    api_key="your-groq-api-key",
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-20b",
    input="What is 1312 X 3333? Output only the final answer.",
    tool_choice="required",
    tools=[
        {
            "type": "code_interpreter",
            "container": {
                "type": "auto"
            }
        }
    ]
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "input": "What is 1312 X 3333? Output only the final answer.",
    "tool_choice": "required",
    "tools": [
      {
        "type": "code_interpreter",
        "container": {
          "type": "auto"
        }
      }
    ]
  }'
```

### [Browser Search Example](#browser-search-example)

Give your models access to real-time web content and up-to-date information - see our [browser search documentation](https://console.groq.com/docs/browser-search) for more details.

javascript

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-20b",
  input: "Analyze the current weather in San Francisco and provide a detailed forecast.",
  tool_choice: "required",
  tools: [
    {
      type: "browser_search"
    }
  ]
});

console.log(response.output_text);
```

```
import openai

client = openai.OpenAI(
    api_key="your-groq-api-key",
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-20b",
    input="Analyze the current weather in San Francisco and provide a detailed forecast.",
    tool_choice="required",
    tools=[
        {
            "type": "browser_search"
        }
    ]
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "input": "Analyze the current weather in San Francisco and provide a detailed forecast.",
    "tool_choice": "required",
    "tools": [
      {
        "type": "browser_search"
      }
    ]
  }'
```

## [Structured Outputs](#structured-outputs)

Use structured outputs to ensure the model's response follows a specific JSON schema. This is useful for extracting structured data from text, ensuring consistent response formats, or integrating with downstream systems that expect specific data structures.

For a complete list of models that support structured outputs, see our [structured outputs documentation](https://console.groq.com/docs/structured-outputs).

javascript

```
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await openai.responses.create({
  model: "moonshotai/kimi-k2-instruct-0905",
  instructions: "Extract product review information from the text.",
  input: "I bought the UltraSound Headphones last week and I'm really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'd give it 4.5 out of 5 stars.",
  text: {
    format: {
      type: "json_schema",
      name: "product_review",
      schema: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          rating: { type: "number" },
          sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral"]
          },
          key_features: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["product_name", "rating", "sentiment", "key_features"],
        additionalProperties: false
      }
    }
  }
});

console.log(response.output_text);
```

```
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="moonshotai/kimi-k2-instruct-0905",
    instructions="Extract product review information from the text.",
    input="I bought the UltraSound Headphones last week and I'm really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'd give it 4.5 out of 5 stars.",
    text={
        "format": {
            "type": "json_schema",
            "name": "product_review",
            "schema": {
                "type": "object",
                "properties": {
                    "product_name": {"type": "string"},
                    "rating": {"type": "number"},
                    "sentiment": {
                        "type": "string",
                        "enum": ["positive", "negative", "neutral"]
                    },
                    "key_features": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["product_name", "rating", "sentiment", "key_features"],
                "additionalProperties": False
            }
        }
    }
)

print(response.output_text)
```

```
curl -X POST "https://api.groq.com/openai/v1/responses" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moonshotai/kimi-k2-instruct-0905",
    "instructions": "Extract product review information from the text.",
    "input": "I bought the UltraSound Headphones last week and I'\''m really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'\''d give it 4.5 out of 5 stars.",
    "text": {
      "format": {
        "type": "json_schema",
        "name": "product_review",
        "schema": {
          "type": "object",
          "properties": {
            "product_name": { "type": "string" },
            "rating": { "type": "number" },
            "sentiment": {
              "type": "string",
              "enum": ["positive", "negative", "neutral"]
            },
            "key_features": {
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["product_name", "rating", "sentiment", "key_features"],
          "additionalProperties": false
        }
      }
    }
  }'
```

Result

JSON

```
{
  "product_name": "UltraSound Headphones",
  "rating": 4.5,
  "sentiment": "positive",
  "key_features": [
      "noise cancellation",
      "long battery life",
      "crisp and clear sound quality"
  ]
}
```

### [Using a Schema Validation Library](#using-a-schema-validation-library)

When working with Structured Outputs, you can use popular schema validation libraries like [Zod](https://zod.dev/) for TypeScript and [Pydantic](https://docs.pydantic.dev/latest/) for Python. These libraries provide type safety, runtime validation, and seamless integration with JSON Schema generation.

javascript

```
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const Recipe = z.object({
  title: z.string(),
  description: z.string(),
  prep_time_minutes: z.number(),
  cook_time_minutes: z.number(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
});

const response = await openai.responses.parse({
  model: "openai/gpt-oss-20b",
  input: [
    { role: "system", content: "Create a recipe." },
    {
      role: "user",
      content: "Healthy chocolate coconut cake",
    },
  ],
  text: {
    format: zodTextFormat(Recipe, "recipe"),
  },
});

const recipe = response.output_parsed;
console.log(recipe);
```

```
import os
from openai import OpenAI
from pydantic import BaseModel


class Recipe(BaseModel):
    title: str
    description: str
    prep_time_minutes: int
    cook_time_minutes: int
    ingredients: list[str]
    instructions: list[str]


client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

response = client.responses.parse(
    model="openai/gpt-oss-20b",
    input=[
        {"role": "system", "content": "Create a recipe."},
        {
            "role": "user",
            "content": "Healthy chocolate coconut cake",
        },
    ],
    text_format=Recipe,
)

recipe = response.output_parsed
print(recipe)
```

## [Reasoning](#reasoning)

Use reasoning to let the model produce an internal chain of thought before generating a response. This is useful for complex problem solving, multi-step agentic workflow planning, and scientific analysis.

For a complete list of models that support reasoning, see our [reasoning documentation](https://console.groq.com/docs/reasoning).

javascript

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-20b",
  input: "How are AI models trained? Be brief.",
  reasoning: {
    effort: "low"
  }
});

console.log(response.output_text);
```

```
import openai

client = openai.OpenAI(
    api_key="your-groq-api-key",
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-20b",
    input="How are AI models trained? Be brief.",
    reasoning={
        "effort": "low"
    }
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "input": "How are AI models trained? Be brief.",
    "reasoning": {"effort": "low"}
  }'
```

Result

JSON

```
{
  "id": "resp_01k3hgcytaf7vawfkph3pef9qk",
  "object": "response",
  "status": "completed",
  "created_at": 1756155509,
  "output": [
    {
      "type": "reasoning",
      "id": "resp_01k3hgcytaf7vsyqqdk1932swk",
      "status": "completed",
      "content": [
        {
          "type": "reasoning_text",
          "text": "Need brief explanation."
        }
      ],
      "summary": []
    },
    {
      "type": "message",
      "id": "msg_01k3hgcytaf7w9wzkh0w18ww1q",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "AI models are trained by showing them many examples and adjusting their internal parameters so they make better predictions.1. **Define a task** (e.g., classify images, translate text, predict next word).  2. **Gather data**—a large set of input‑output pairs.  3. **Choose a model architecture** (e.g., neural network layers).  4. **Initialize weights** randomly or from a pre‑trained checkpoint.  5. **Feed data** through the network, compute an error (loss) between the model’s output and the true answer.  6. **Back‑propagate the error** to update the weights using an optimizer (e.g., SGD, Adam).  7. **Repeat** over many epochs until the loss stops improving.  8. **Validate** on a separate dataset to check generalization.  The process uses gradient descent and large‑scale computation (GPUs/TPUs) to handle the massive parameter count.",
          "annotations": [],
          "logprobs": null
        }
      ]
    }
  ],
  "previous_response_id": null,
  "model": "openai/gpt-oss-20b",
  "reasoning": {
    "effort": "low"
  },
  "max_output_tokens": null,
  "text": {
    "format": {
      "type": "text"
    }
  },
  "tools": [],
  "tool_choice": "auto",
  "truncation": "disabled",
  "metadata": {},
  "temperature": 1,
  "top_p": 1,
  "user": null,
  "service_tier": "default",
  "background": false,
  "error": null,
  "incomplete_details": null,
  "usage": {
    "input_tokens": 80,
    "input_tokens_details": {
      "cached_tokens": 0,
      "reasoning_tokens": 0
    },
    "output_tokens": 213,
    "output_tokens_details": {
      "cached_tokens": 0,
      "reasoning_tokens": 0
    },
    "total_tokens": 293
  },
  "parallel_tool_calls": true,
  "store": false,
  "top_logprobs": 0,
  "max_tool_calls": null
}
```

  
The reasoning traces can be found in the `result.output` array as type "reasoning":

Reasoning Traces

JSON

```
{
  "type": "reasoning",
  "id": "resp_01k3hgcytaf7vsyqqdk1932swk",
  "status": "completed",
  "content": [
    {
      "type": "reasoning_text",
      "text": "Need brief explanation."
    }
  ],
  "summary": []
},
```

## [Model Context Protocol (MCP)](#model-context-protocol-mcp)

The Responses API also supports the [Model Context Protocol (MCP)](https://console.groq.com/docs/mcp), an open-source standard that enables AI applications to connect with external systems like databases, APIs, and tools. MCP provides a standardized way for AI models to access and interact with your data and workflows.

With MCP, you can build AI agents that access your codebase through GitHub, query databases with natural language, browse the web for real-time information, or connect to any API-based service like Slack, Notion, or Google Calendar.

### [MCP Example](#mcp-example)

Here's an example using [Hugging Face's MCP server](https://huggingface.co/settings/mcp) to search for trending AI models.

javascript

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-120b",
  input: "What models are trending on Huggingface?",
  tools: [
    {
      type: "mcp",
      server_label: "Huggingface",
      server_url: "https://huggingface.co/mcp",
    }
  ]
});

console.log(response);
```

```
import openai
import os

client = openai.OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-120b",
    input="What models are trending on Huggingface?",
    tools=[
        {
            "type": "mcp",
            "server_label": "Huggingface",
            "server_url": "https://huggingface.co/mcp",
        }
    ]
)

print(response)
```

```
curl -X POST "https://api.groq.com/openai/v1/responses" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "input": "What models are trending on Huggingface?",
    "tools": [
      {
        "type": "mcp",
        "server_label": "Huggingface",
        "server_url": "https://huggingface.co/mcp"
      }
    ]
  }'
```

For comprehensive examples including GitHub integration, web search, and payment processing, see our full [MCP documentation](https://console.groq.com/docs/mcp).

## [Unsupported Features](#unsupported-features)

Although Groq's Responses API is mostly compatible with OpenAI's Responses API, there are a few features we don't support just yet:

* `previous_response_id`
* `store`
* `truncation`
* `include`
* `safety_identifier`
* `prompt_cache_key`

Want to see one of these features supported? Let us know on our [Community forum](https://community.groq.com)!

## [Detailed Usage Metrics](#detailed-usage-metrics)

To include detailed usage metrics for each request (such as exact inference time), set the following header:

text

```
Groq-Beta: inference-metrics
```

In the response body, the `metadata` field will include the following keys:

* `completion_time`: The time in seconds it took to generate the output
* `prompt_time`: The time in seconds it took to process the input prompt
* `queue_time`: The time in seconds the requests was queued before being processed
* `total_time`: The total time in seconds it took to process the request

JSON

```
{
  "metadata": {
    "completion_time": "2.567331286",
    "prompt_time": "0.003652567",
    "queue_time": "0.018393202",
    "total_time": "2.570983853"
  }
}
```

To calculate output tokens per second, combine the information from the `usage` field with the `metadata` field:

text

```
output_tokens_per_second = usage.output_tokens / metadata.completion_time
```

## [Next Steps](#next-steps)

Explore more advanced use cases in our built-in [browser search](https://console.groq.com/docs/browser-search) and [code execution](https://console.groq.com/docs/code-execution) documentation, or learn about connecting to external systems with [MCP](https://console.groq.com/docs/mcp).


Responses (beta)
Create response
POST
https://api.groq.com/openai/v1/responses

Creates a model response for the given input.

Request Body
input
string / array
Required
Text input to the model, used to generate a response.

Show possible types
model
string
Required
ID of the model to use. For details on which models are compatible with the Responses API, see available models

instructions
string or null
Optional
Inserts a system (or developer) message as the first item in the model's context.

max_output_tokens
integer or null
Optional
An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.

metadata
object or null
Optional
Custom key-value pairs for storing additional information. Maximum of 16 pairs.

parallel_tool_calls
boolean or null
Optional
Defaults to true
Enable parallel execution of multiple tool calls.

reasoning
object or null
Optional
Configuration for reasoning capabilities when using compatible models.

Show properties
service_tier
string or null
Optional
Defaults to auto
Allowed values: auto, default, flex
Specifies the latency tier to use for processing the request.

store
boolean or null
Optional
Defaults to false
Response storage flag. Note: Currently only supports false or null values.

stream
boolean or null
Optional
Defaults to false
Enable streaming mode to receive response data as server-sent events.

temperature
number or null
Optional
Defaults to 1
Range: 0 - 2
Controls randomness in the response generation. Range: 0 to 2. Lower values produce more deterministic outputs, higher values increase variety and creativity.

text
object
Optional
Response format configuration. Supports plain text or structured JSON output.

Show properties
tool_choice
string / object or null
Optional
Controls which (if any) tool is called by the model. none means the model will not call any tool and instead generates a message. auto means the model can pick between generating a message or calling one or more tools. required means the model must call one or more tools. Specifying a particular tool via {"type": "function", "function": {"name": "my_function"}} forces the model to call that tool.

none is the default when no tools are present. auto is the default if tools are present.

Show possible types
tools
array or null
Optional
List of tools available to the model. Currently supports function definitions only. Maximum of 128 functions.

Show properties
top_p
number or null
Optional
Defaults to 1
Range: 0 - 1
Nucleus sampling parameter that controls the cumulative probability cutoff. Range: 0 to 1. A value of 0.1 restricts sampling to tokens within the top 10% probability mass.

truncation
string or null
Optional
Defaults to disabled
Allowed values: auto, disabled
Context truncation strategy. Supported values: auto or disabled.

user
string
Optional
Optional identifier for tracking end-user requests. Useful for usage monitoring and compliance.

Response Object
background
boolean
Whether the response was generated in the background.

created_at
integer
The Unix timestamp (in seconds) of when the response was created.

error
object or null
An error object if the response failed.

Show properties
id
string
A unique identifier for the response.

incomplete_details
object or null
Details about why the response is incomplete.

Show properties
instructions
string or null
The system instructions used for the response.

max_output_tokens
integer or null
The maximum number of tokens configured for the response.

max_tool_calls
integer or null
The maximum number of tool calls allowed.

metadata
object or null
Metadata attached to the response.

model
string
The model used for the response.

object
string
Allowed values: response
The object type, which is always response.

output
array
An array of content items generated by the model.

Show possible types
parallel_tool_calls
boolean
Whether the model can run tool calls in parallel.

previous_response_id
string or null
Not supported. Always null.

reasoning
object or null
Configuration options for reasoning models.

Show properties
service_tier
string
Allowed values: auto, default, flex
The service tier used for processing.

status
string
Allowed values: completed, failed, in_progress, incomplete
The status of the response generation. One of completed, failed, in_progress, or incomplete.

store
boolean
Whether the response was stored.

temperature
number
The sampling temperature used.

text
object
Text format configuration used for the response.

Show properties
tool_choice
string / object or null
Controls which (if any) tool is called by the model. none means the model will not call any tool and instead generates a message. auto means the model can pick between generating a message or calling one or more tools. required means the model must call one or more tools. Specifying a particular tool via {"type": "function", "function": {"name": "my_function"}} forces the model to call that tool.

none is the default when no tools are present. auto is the default if tools are present.

Show possible types
tools
array
The tools that were available to the model.

Show properties
top_logprobs
integer
The number of top log probabilities returned.

top_p
number
The nucleus sampling parameter used.

truncation
string
Allowed values: auto, disabled
The truncation strategy used.

usage
object
Usage statistics for the response request.

Show properties
user
string or null
The user identifier.


Example request


curl https://api.groq.com/openai/v1/responses -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $GROQ_API_KEY" \
-d '{
  "model": "openai/gpt-oss-120b",
  "input": "Tell me a three sentence bedtime story about a unicorn."
}'


Example Response

{
  "id": "resp_01k1x6w9ane6d8rfxm05cb45yk",
  "object": "response",
  "status": "completed",
  "created_at": 1754400695,
  "output": [
    {
      "type": "message",
      "id": "msg_01k1x6w9ane6eb0650crhawwyy",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "When the stars blinked awake, Luna the unicorn curled her mane and whispered wishes to the sleeping pine trees. She galloped through a field of moonlit daisies, gathering dew like tiny silver pearls. With a gentle sigh, she tucked her hooves beneath a silver cloud so the world slept softly, dreaming of her gentle hooves until the morning.",
          "annotations": []
        }
      ]
    }
  ],
  "previous_response_id": null,
  "model": "llama-3.3-70b-versatile",
  "reasoning": {
    "effort": null,
    "summary": null
  },
  "max_output_tokens": null,
  "instructions": null,
  "text": {
    "format": {
      "type": "text"
    }
  },
  "tools": [],
  "tool_choice": "auto",
  "truncation": "disabled",
  "metadata": {},
  "temperature": 1,
  "top_p": 1,
  "user": null,
  "service_tier": "default",
  "error": null,
  "incomplete_details": null,
  "usage": {
    "input_tokens": 82,
    "input_tokens_details": {
      "cached_tokens": 0
    },
    "output_tokens": 266,
    "output_tokens_details": {
      "reasoning_tokens": 0
    },
    "total_tokens": 348
  },
  "parallel_tool_calls": true,
  "store": false
}
