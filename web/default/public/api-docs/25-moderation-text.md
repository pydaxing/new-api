# 文本审查

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/moderations`

> **提示** 该端点模型详细使用方法，可参考 [OpenAI官方文档](https://platform.openai.com/docs/guides/moderation#page-top)


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 - 可使用的模型，可在本站 [模型列表](https://pydaxing.com/pricing) 中选择 `内容审查` 标签，即可查找可使用的审查模型。 |
| `input` | string | 是 | 审查文本 - 需要进行审查的文本内容 |

## 请求示例

```bash
curl https://pydaxing.com/v1/moderations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "text-moderation-latest",
  "input": "她长得非常漂亮，喜欢..."
}'
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://pydaxing.com/v1"
)

response = client.moderations.create(
    input="她长得非常漂亮，喜欢..."
)
print(response.results[0])
```

## 响应示例

```json
{
  "id": "modr-970d409ef3bef3b70c73d8232df86e7d",
  "model": "text-moderation-latest",
  "results": [
    {
      "flagged": true,
      "categories": {
        "sexual": false,
        "sexual/minors": false,
        "harassment": false,
        "harassment/threatening": false,
        "hate": false,
        "hate/threatening": false,
        "illicit": false,
        "illicit/violent": false,
        "self-harm": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "violence": true,
        "violence/graphic": false
      },
      "category_scores": {
        "sexual": 2.34135824776394e-7,
        "sexual/minors": 1.6346470245419304e-7,
        "harassment": 0.0011643905680426018,
        "harassment/threatening": 0.0022121340080906377,
        "hate": 3.1999824407395835e-7,
        "hate/threatening": 2.4923252458203563e-7,
        "illicit": 0.0005227032493135171,
        "illicit/violent": 3.682979260160596e-7,
        "self-harm": 0.0011175734280627694,
        "self-harm/intent": 0.0006264858507989037,
        "self-harm/instructions": 7.368592981140821e-8,
        "violence": 0.8599265510337075,
        "violence/graphic": 0.37701736389561064
      },
      "category_applied_input_types": {
        "sexual": [
          "image"
        ],
        "sexual/minors": [],
        "harassment": [],
        "harassment/threatening": [],
        "hate": [],
        "hate/threatening": [],
        "illicit": [],
        "illicit/violent": [],
        "self-harm": [
          "image"
        ],
        "self-harm/intent": [
          "image"
        ],
        "self-harm/instructions": [
          "image"
        ],
        "violence": [
          "image"
        ],
        "violence/graphic": [
          "image"
        ]
      }
    }
  ]
}
```