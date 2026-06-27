# 列出单个模型

## 接口信息

- **请求方式**: `GET`
- **请求路径**: `/v1/models/{model}`

列出当前令牌KEY所支持的模型列表。  |数据格式|Header传参| |--|--| |OpenAI格式|Authorization: Bearer sk-xxx| |Anthropic格式|x-api-key: sk-xxx<br>anthropic-version: 2023-06-01| |Google格式|x-goog-api-key: sk-xxx|


## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`
