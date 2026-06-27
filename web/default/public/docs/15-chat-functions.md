# 聊天接口（函数调用）

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/chat/completions`

## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型 |
| `messages` | array | 是 | 消息列表 |
| `tools` | array | 是 | 工具列表 - 模型可以调用的工具列表。目前，仅支持将函数作为工具。使用此选项可提供模型可能为其生成 JSON 输入的函数列表。最多支持 128 个函数。 |

## 请求示例

```bash
curl https://pydaxing.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "What is the weather like in Paris today?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current temperature for a given location.",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City and country e.g. Bogotá, Colombia"
            }
          },
          "required": [
            "location"
          ],
          "additionalProperties": false
        },
        "strict": true
      }
    }
  ]
}'
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://pydaxing.com/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}],
)
print(response.choices[0].message.content)
```

## 响应示例

```json
{
  "id": "chatcmpl-Ax2bU1RFE8P0Y9uqKcErQNLcx4dDe",
  "object": "chat.completion",
  "created": 1738634724,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_FezxjoWuDV1CL3dITVFOjUzK",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\":\"Paris, France\"}"
            }
          }
        ],
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 65,
    "completion_tokens": 16,
    "total_tokens": 81,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "system_fingerprint": "fp_f3927aa00d"
}
```