# 图片审查

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/moderations`

> **提示** 该端点模型详细使用方法，可参考 [OpenAI官方文档](https://platform.openai.com/docs/guides/moderation#page-top)


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 - 本站目前支持的图片审查模型是 `gi-image-moderation` |
| `input` | array | 是 | 审查文本 - 需要进行审查的文本内容 |

## 请求示例

```bash
curl https://pydaxing.com/v1/moderations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "gi-image-moderation",
  "input": [
    {
      "type": "image_url",
      "image_url": {
        "url": "https://oss.chats.li/1744473372484_8815.png"
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

response = client.moderations.create(
    input="[object Object]"
)
print(response.results[0])
```

## 响应示例

```json
{
  "id": "abfc99e9-392e-44e3-aedd-e63f33079491",
  "model": "nsfw-classifier",
  "results": [
    {
      "flagged": false,
      "categories": {
        "neutral": false,
        "drawings": true,
        "sexy": false,
        "hentai": false,
        "porn": false
      },
      "category_scores": {
        "neutral": 0.22734691202640533,
        "drawings": 0.9943661689758301,
        "sexy": 0.12325877696275711,
        "hentai": 0.2198520451784134,
        "porn": 0.05567243695259094
      }
    }
  ]
}
```