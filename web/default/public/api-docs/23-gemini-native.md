# Gemini (原生格式)-可文件分析

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1beta/models/{model}:{action}`

:::tip 注意：Gemini原生请求参数支持：下划线命名和小驼峰命名。我们平台统一使用小驼峰命名参数，否则部分参数可能无法被正确识别。 例如：tool_config（❌）和toolConfig (✅) :::  本文档只列出基础参数，更多参数和使用示例，请查阅 [Gemini官方开发手册](https://ai.google.dev/models/gemini?hl=zh-cn)


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `contents` | array | 是 |  |

## 请求示例

```bash
curl https://pydaxing.com/v1beta/models/{model}:{action} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "你好吗"
        }
      ]
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

models = client.models.list()
for model in models.data:
    print(model.id)
```