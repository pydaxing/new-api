# OpenAI官方SDK使用教程

> **提示**
我们的API，完全兼容OpenAI接口协议，支持无缝对接各种支持OpenAI接口的应用。
注意： 所有聊天模型（包括非openai模型）都支持openai官方库，请求url和格式请都遵循openai的请求方式。
参考：[官方开发文档](https://platform.openai.com/docs/introduction/overview)

Cluade模型同时支持官方与OpenAi两种请求方式。

请求接口时将 `https://api.openai.com` 改为我们的API地址（在 `API网站` -> `控制台` 中可查看API地址） 
你的KEY要与API网站对应，千万别将混合站点与官转站点弄混了。

## OpenAi官方python库

> [官方项目地址](https://github.com/openai/openai-python)
> ⚠️ 注意：请将openai库升级到1.25+版本或最新版本，否则调用出错不提供任何帮助。

### 安装

```sh
pip install openai
```

### 请求示例：

注意：`base_url`需要传入`/v1/`后缀。

```python
import os
import openai

openai.api_key = "您的apikey"

openai.base_url = "https://pydaxing.com/v1/"
openai.default_headers = {"x-foo": "true"}

completion = openai.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[
        {
            "role": "user",
            "content": "Hello world!",
        },
    ],
)
print(completion.choices[0].message.content)

# 正常会输出结果：Hello there! How can I assist you today ?
```

## OpenAi官方node库

> [官方项目地址](https://github.com/openai/openai-node)
> ⚠️ 注意：请将openai库升级到最新版本，否则调用出错不提供任何帮助。

### 安装

```sh
npm install openai
```

### 请求示例：

注意：`base_url`需要传入`/v1`后缀。

