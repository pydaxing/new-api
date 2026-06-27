# 聊天接口（图片分析）

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/chat/completions`

## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 - 必须是支持图片分析的模型 |
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
| `stop` | string | 否 | 传入该参数后，当遇到匹配的关键词 请求自动停止并完成。可传入字符串或字符串数组。 |

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
      "content": [
        {
          "type": "text",
          "text": "这是什么?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,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"
          }
        }
      ]
    }
  ],
  "max_tokens": 300
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
  "id": "chatcmpl-A7ETdn5hnbTjpw9dtRifjMFZYcdFW",
  "object": "chat.completion",
  "created": 1726287309,
  "model": "gpt-4o-2024-05-13",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "这是一张卡通风格的老人头像图像。这个角色有着白色的头发和胡须，脸上带着灿烂的笑容，穿着蓝色的衣服。",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 265,
    "completion_tokens": 46,
    "total_tokens": 311,
    "completion_tokens_details": {
      "reasoning_tokens": 0
    }
  },
  "system_fingerprint": "fp_992d1ea92d"
}
```