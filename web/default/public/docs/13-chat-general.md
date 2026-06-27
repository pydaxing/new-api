# 聊天接口（通用）

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/chat/completions`

只提供简单的请求示例，更详细的API接口使用说明 [请阅读官方文档](https://platform.openai.com/docs/api-reference/chat) 注意：OpenAI、Claude、Gemini...等聊天模型均使用该接口格式。


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 |
| `messages` | array | 是 |  |
| `temperature` | integer | 否 | 温度 - 使用什么采样温度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如 0.2）将使输出更加集中和确定。 我们通常建议改变这个或`top_p`但不是两者同时使用。 |
| `top_p` | integer | 否 | 一种替代温度采样的方法，称为核采样，其中模型考虑具有 top_p 概率质量的标记的结果。所以 0.1 意味着只考虑构成前 10% 概率质量的标记。 我们通常建议改变这个或`temperature`但不是两者同时使用。 |
| `stream` | boolean | 否 | 流式输出 - 流式输出或非流式输出 |
| `max_tokens` | number | 否 | 最大回复 - 聊天完成时生成的最大Tokens数量。 输入标记和生成标记的总长度受模型上下文长度的限制。 |
| `n` | number | 否 | 为每个输入消息生成多少个聊天完成选项。 |
| `presence_penalty` | integer | 否 | -2.0 和 2.0 之间的数字。正值会根据到目前为止是否出现在文本中来惩罚新标记，从而增加模型谈论新主题的可能性。 |
| `frequency_penalty` | integer | 否 | -2.0 和 2.0 之间的数字。正值会根据新标记在文本中的现有频率对其进行惩罚，从而降低模型逐字重复同一行的可能性。 |
| `logit_bias` | null | 否 | 修改指定标记出现在完成中的可能性。 接受一个 json 对象，该对象将标记（由标记器中的标记 ID 指定）映射到从 -100 到 100 的关联偏差值。从数学上讲，偏差会在采样之前添加到模型生成的 logits 中。确切的效果因模型而异，但 |
| `user` | string | 否 | 代表您的最终用户的唯一标识符，可以帮助 OpenAI 监控和检测滥用行为。[了解更多](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids) |
| `stop` | array | 否 | 传入该参数后，当遇到匹配的关键词 请求自动停止并完成。可传入字符串或字符串数组。 |
| `response_format` | object | 否 | 结构化输出 - 该参数用法，请查阅 [结构化模型输出](https://platform.openai.com/docs/guides/structured-outputs?example=ui-generation) |

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
      "content": "晚上好"
    }
  ],
  "max_tokens": 1688,
  "temperature": 0.5,
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
    model="gpt-4o",
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