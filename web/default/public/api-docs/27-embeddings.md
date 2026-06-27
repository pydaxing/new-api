# 创建嵌入

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/embeddings`

## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 - 要使用的模型的 ID。您可以使用[模型列表](https://platform.openai.com/docs/api-reference/models/list) API 来查看所有可用模型，或查看我们的[模型概述](https://pl |
| `input` | string | 是 | 输入文本 - 输入文本以获取嵌入，编码为字符串或标记数组。要在单个请求中获取多个输入的嵌入，请传递一个字符串数组或令牌数组数组。每个输入的长度不得超过 8192 个标记。 |

## 请求示例

```bash
curl https://pydaxing.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "text-embedding-3-large",
  "input": "她长得非常漂亮，喜欢..."
}'
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://pydaxing.com/v1"
)

response = client.embeddings.create(
    model="text-embedding-3-large",
    input="她长得非常漂亮，喜欢..."
)
print(response.data[0].embedding[:5])
```

## 响应示例

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        -0.022425562,
        -0.010263717,
        0.022136442,
        0.015323295,
        -0.0013466021,
        -0.009163808,
        -0.025279038,
        0.007510803,
        -0.017573394,
        -0.049326178,
        0.025216186,
        -0.012972634,
        0.01647977,
        0.025316749,
        0.03813854,
        -0.005716381,
        -0.011501899,
        -0.04020008,
        0.0023978003,
        -0.037761427,
        -0.016064947,
        0.029364413,
        0.013664005,
        0.035674743,
        0.034442846,
        -0.014506221,
        0.014091398,
        0.012488674,
        -0.03167736,
        -0.014506221,
        -0.0009066388
      ]
    }
  ],
  "model": "text-embedding-3-large",
  "usage": {
    "prompt_tokens": 16,
    "total_tokens": 16
  }
}
```