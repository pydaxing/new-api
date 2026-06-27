# gpt-4o-all 文件分析

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/chat/completions`

`gpt-4o-all` 支持图片分析、文件分析、联网等功能（内核基于gpt-4o模型）  - 图片分析：在`content`中直接传入图片url即可分析，也支持openai图片分析接口协议 - 文件分析：在`content`中直接传入文件url即可分析：格式： 文件url +空格+ 提问内容


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

## 请求示例

```bash
curl https://pydaxing.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "gpt-4-all",
  "messages": [
    {
      "role": "user",
      "content": "https://www.bt.cn/data/api-doc.pdf 添加域名的api是什么？"
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
    model="gpt-4-all",
    messages=[{"role": "user", "content": "你好"}],
    stream=False,
)
print(response.choices[0].message.content)
```

## 响应示例

```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "要添加域名的API，文件中提到以下内容：\n\n1. **API路径**: `/domains/add`\n2. **请求方法**: `POST`\n3. **请求参数**:\n   - `domain`: 要添加的域名（字符串）\n   - `user_id`: 用户ID（字符串）\n   - `type`: 域名类型，可能的值有 `primary` 或 `secondary`（字符串）\n   - 其他可选参数包括 `description`、`tags` 等。\n\n4. **请求示例**:\n   "
      }
    }
  ]
}
```