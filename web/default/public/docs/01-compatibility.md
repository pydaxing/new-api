# 前言-模型兼容性（必读）

## 模型兼容

我们的API，完全兼容OpenAI接口协议，支持无缝对接各种支持OpenAI接口的应用。
> 注意： 所有聊天模型（包括非OpenAI模型）都支持OpenAI官方库，请求url和格式请都遵循OpenAI的请求方式。
参考：[官方开发文档](https://platform.openai.com/docs/introduction/overview)

|聊天接口类型|接口地址|接口说明|
|--|--|--|
|OpenAi通用格式|/v1/chat/completions|可请求本站所有chat类型模型(包括非OpenAI模型)|
|OpenAi新的格式|/v1/responses|仅部分OpenAI新模型支持，建议使用上方通用格式|
|Claude原生格式|/v1/messages|只能请求支持claude原生格式的模型，其他模型请求将:无可用|
|Gemini原生格式|/v1beat/models/...|只能请求Gemini模型，其他模型请求将:无可用，参数统一使用小驼峰命名，例如imageSize(正确)、image_size（错误）|

## 身份认证

所有 API 请求都应在 HTTP `Header` 请求头中包含您的API密钥（令牌KEY）如下所示：

|数据格式|Header传参|
|--|--|
|OpenAI通用格式|Authorization: Bearer sk-xxx|
|Claude原生格式|x-api-key: sk-xxx<br>anthropic-version: 2023-06-01|
|Gemini原生格式|x-goog-api-key: sk-xxx|

## API地址

请在我们的`API网站` -> `控制台` 中查看当前站点的API地址。

> 切勿绑错API地址和KEY 以免造成请求失败而无法排查原因。

## 参考资料

- [OpenAI官方开发文档](https://platform.openai.com/docs/api-reference/introduction)
- [Cluade官方开发文档-需翻墙](https://docs.anthropic.com/en/docs/about-claude/models)
- [Gemini官方开发文档](https://ai.google.dev/models/gemini?hl=zh-cn)
