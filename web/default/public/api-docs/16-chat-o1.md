# 聊天接口（o1-o3系列模型）

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/chat/completions`

> **提示** o1系列模型官方暂不支持流式输出


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 |
| `messages` | array | 是 |  |
| `stream` | boolean | 否 | 流式输出 - 该模型仅支持 false |
| `max_completion_tokens` | number | 否 | 最大回复 - 聊天完成时生成的最大Tokens数量。 输入标记和生成标记的总长度受模型上下文长度的限制。 |

## 请求示例

```bash
curl https://pydaxing.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "o1-mini",
  "messages": [
    {
      "role": "user",
      "content": "晚上好"
    }
  ],
  "max_completion_tokens": 1688,
  "stream": false
}'
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://pydaxing.com/v1"
)

response = client.chat.completions.create(
    model="o1-mini",
    messages=[{"role": "user", "content": "你好"}],
    stream=False,
)
print(response.choices[0].message.content)
```

## 响应示例

```json
{
  "id": "chatcmpl-A1iMgDLzZtUJ9QDpfqDLxKH0zfUnp",
  "object": "chat.completion",
  "created": 1724972230,
  "model": "gpt-4o-2024-05-13",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "晚上好！有什么我可以帮你的吗？",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 10,
    "total_tokens": 19
  },
  "system_fingerprint": "fp_157b3831f5"
}
```