# Claude (原生格式)-可PDF分析

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/messages`

> **提示**
>
> Claude模型同时支持OpenAI请求格式与官方请求格式。
> 官方请求格式只列出常用参数，更详细的请求参数请阅读 [claude官方文档](https://docs.anthropic.com/zh-CN/api/getting-started)
> 
> 走OpenAI格式 将不会计算缓存，走官方格式会完全走缓存计费方式。  [官方缓存使用与说明](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

支持Claude原生请求的模型：
- cld-、claude-开头的所有模型
- kimi-k2-0711-preview或更高版本
- qwen3-coder-plus
- glm-4.5或更高版本


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 |
| `messages` | array | 是 |  |
| `temperature` | number | 否 | 温度 - 使用什么采样温度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如 0.2）将使输出更加集中和确定。 我们通常建议改变这个或`top_p`但不是两者同时使用。 |
| `top_p` | number | 否 | 一种替代温度采样的方法，称为核采样，其中模型考虑具有 top_p 概率质量的标记的结果。所以 0.1 意味着只考虑构成前 10% 概率质量的标记。 我们通常建议改变这个或`temperature`但不是两者同时使用。 |
| `stream` | boolean | 否 | 流式输出 - 流式输出或非流式输出 |
| `max_tokens` | number | 否 | 最大回复 - 聊天完成时生成的最大Tokens数量。 输入标记和生成标记的总长度受模型上下文长度的限制。 |
| `tools` | object | 否 | 函数调用 - tools函数详细参数与用法，请阅读 [官方文档](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) |
| `top_k` | integer | 否 |  |
| `thinking` | object | 否 | 开启思考 - 该参数仅支持模型`claude-3-7-sonnet-20250219` 设置后ai回复将会先思考 再回复。 |

## 请求示例

```bash
curl https://pydaxing.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "你好，你是？"
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

# 请根据具体接口调用相应方法
# 参考: https://github.com/openai/openai-python
```

## 响应示例

```json
{
  "id": "msg_014AoBefsejHUjbdRntn7euw",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "你好!很高兴见到你。今天过得怎么样?有什么我可以帮助你的吗?"
    }
  ],
  "model": "claude-sonnet-4-6",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 12,
    "output_tokens": 38
  }
}
```