# OpenCode 配置使用 API 教程

本文档旨在说明如何将符合 OpenAI 接口规范的第三方 API 服务集成到 OpenCode 环境中。

:::warning 注意
如果你想在 OpenCode 中使用 Gemini 模型，可以尝试使用 Chat 格式，如果使用原生格式请使用其他编程工具，OpenCode 使用 Gemini 模型因格式协议问题可能会报错不兼容，请大家知悉！

## 1. OpenCode 环境准备

1. 确保你的 OpenCode CLI 环境已就绪（版本建议更新至最新）：
```sh
pnpm install -g @opencode/cli
```

## 2. OpenCode CLI 凭证注册

在修改配置文件前，需先在本地密钥管理器中注册一个服务商别名（Provider ID）。这一步是为了安全地托管 API Key，避免在配置文件中明文硬编码。
1.执行认证指令：
```sh
opencode auth login
```
2. 选择类型：在列表中定位并选中底部的 other(可以直接打字搜索)。
3. 定义 ID：输入一个自定义标识符（例如 local）。
4. 录入密钥：输入你在V-API平台上已创建的令牌密钥 API Key（sk-xxxx）。

## 3. OpenCode 配置第三方 API

OpenCode 通过`opencode.json`文件来解析服务商参数。请根据你的操作系统定位并新建/编辑该文件。

### 配置文件路径

<Tabs>
  <Tab title="Window">
    ```sh
      `%USERPROFILE%\.config\opencode\opencode.json`
      ```
  </Tab>
  <Tab title="MacOs/Linux">
    ```sh
      `~/.config/opencode/opencode.json`
      ```
  </Tab>
</Tabs>

### 配置模版

```sh
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "local",
      "options": {
        "baseURL": "http://api.gpt.ge/v1",
      },
      "models": {
        "gpt-4o": { "name": "gpt-4o" },
        "claude-sonnet-4-6": { "name": "claude-sonnet-4-6" }
      }
    }
  }
}
```

### 参数映射详解

|参数节点|	说明|
|---|---|
|根键名 (custom_proxy)	|必须与 CLI 注册时的 Provider ID 完全一致（大小写敏感）。|
|npm	|固定使用 @ai-sdk/openai-compatible 以适配通用协议。|
|baseURL	|填写V-API平台的API接口地址，通常需包含 /v1 后缀。|
|apiKey	|使用 "{cred:ID}" 语法。系统会自动从本地凭证库中提取对应 ID 的密钥，实现无明文配置。|
|models	|需手动声明V-API平台支持的模型列表，键名（Key）需对应真实的 Model ID。|

## 4. OpenCode 加载与验证

配置完成后，重启客户端以加载新的映射关系。

1. 启动主程序：
```sh
opencode
```
2. 在交互栏输入指令调出模型菜单：
```sh
/models
```
3. 若配置无误，你将在列表中看到自定义的V-API平台及其模型。

## 🛠 排错核对清单

- ID 锚点检查：JSON 中的键名是否与`opencode auth login`时输入的`Provider ID`字面量完全相等？
- 接口路径：baseURL 是否正确？也可能不需要 /v1，可以把接口地址文档中列出的所有地址都试一下，也可以先使用 Curl 或 Postman 验证 /v1/models 接口连通性。
- 模型映射：models 下定义的模型 ID 是否与V-API平台上模型广场中的模型名称完全一致？
- 缓存清理：若修改未生效，请尝试彻底关闭终端进程后再次启动。
