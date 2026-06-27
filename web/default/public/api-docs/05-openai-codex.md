# OpenAi Codex最佳API配置教程指南

Codex 是OpenAI 推出的一系列人工智能编码工具，通过将任务委托给强大的云端和本地编码代理，帮助开发人员提升工作效率。支持原生终端、vscode插件、cursor插件等场景使用。

官网网站 https://openai.com/codex/

## 系统要求

|系统要求|细节|
|--|--|
|操作系统|macOS 12+、Ubuntu 20.04+/Debian 10+ 或通过 WSL2 的Windows 11|
|Git（可选，推荐）|2.23+ 内置 PR 助手|
|内存|最低 4 GB（建议 8 GB）|
|Node版本|需要Node 22+|

## 步骤一：安装Codex CLI

选择一种安装方式即可。

**npm（通用）**
```bash
npm i -g @openai/codex

# 或在有时需要的原生包名：
# npm i -g @openai/codex@native

codex --version
```

**Homebrew（macos系统推荐）**

```bash
brew update
brew install codex
codex --version
```
> 如遇 codex 无法执行或 Node 版本过旧，请升级 Node（常见需要 Node 22+），或改用 Homebrew 安装。

## Codex配置

安装后，我们开始配置codex才能通过apikey方式接入我们的API。如果你是通过openai plus会员来使用codex，可跳过后续教程，codex中直接登录plus账号即可使用。

### 1.在v-api平台注册并充值

进入网站 https://api.v3.cm 进行注册并充值，然后在“令牌管理”页面，复制apikey，后续需要用到。

### 2.codex配置文件config.toml

Codex 启动时会在`~/.codex/` 读取`config.toml`文件。若不存在就新建：

```bash
mkdir -p ~/.codex
nano ~/.codex/config.toml
```

在`config.toml`中加入如下配置，根据需求修改：

```json
model_provider = "vapi"  # 设置API供应商
model = "gpt-5.1"        # 填写支持codex的模型即可
model_reasoning_effort = "low" # 思考级别 low medium（默认） high minimal，不需要可以#注释掉

# 供应商设置
[model_providers.vapi]
name = "VAPI"
base_url = "https://api.v3.cm/v1"
env_key = "V_API_KEY"    # 保留这个值，不需要替换为apikey
wire_api = "responses" # 使用 /v1/responses 端点
query_params = {}
request_max_retries = 3            # 失败最大重试次数
stream_max_retries = 6            # 流中断后最大重试次数

# 可选：定义一个 profile，便于命令行快速切换
[profiles.vapi]
model_provider = "vapi"
model = "gpt-5.1"
approval_policy = "on-request"      # 需要时再询问是否执行
sandbox_mode = "workspace-write"    # 允许在当前工程写文件，依旧禁网

```

### 3.添加apikey环境变量

这步很重要，我们需要将我们设置的环境变量`V_API_KEY`添加到系统配置中。
> key值就是我们从“令牌管理”页面复制的sk-开头的apikey。

#### Window用户设置apikey环境变量：

```bash
# 临时设置，切换窗口后失效
set V_API_KEY=sk-xxxxxx

# 永久设置
setx V_API_KEY "sk-xxxxxx"
```

#### Mac/Linux用户设置环境变量：

**方法一：永久设置（推荐)**

1.编辑配置文件（或直接手动打开文件）
```bash
# 如果使用 bash
nano ~/.bash_profile
# 或
nano ~/.bashrc

# 如果使用 zsh（Mac默认）
nano ~/.zshrc
```

2.在最后新行，添加以下内容

```bash
export V_API_KEY="sk-xxxxxx"
```

3.保存并生效

```bash
# bash
source ~/.bash_profile

# zsh
source ~/.zshrc

```

**方法二：临时设置**

```bash
export V_API_KEY="sk-xxxxxx"
```

#### 验证是否设置成功


```bash
# Windows (CMD)
echo %V_API_KEY%

# Windows (PowerShell)
echo $env:V_API_KEY

# Mac/Linux
echo $V_API_KEY
```

如果显示`sk-xxxxxx`则说明设置成功！

## 启动命令

### Codex CLI原生命令

```bash
# 直接提问
codex "你好"

# 选择提供商并提问(如果有多个提供商的话)
codex --profile vapi "你好"
```

### vscode中使用Codex插件

如果是在vscode中使用codex插件，我们配置好后需要完全退出vscode重新启动才能生效。


## Codex高级使用技巧指南

### CLI 参考

|命令|目的|例子|
|--|--|--|
|codex|交互式TUI|codex|
|codex "..."|交互式 TUI 的初始提示|codex "fix lint errors"|
|codex exec "..."|非交互式"自动化模式"|codex exec "explain utils.ts"|

### 非交互/CI模式

在管道中以无头方式运行 Codex。示例 GitHub Action 步骤：

```bash
- name: Update changelog via Codex
  run: |
    npm install -g @openai/codex
    export OPENAI_API_KEY="${{ secrets.OPENAI_KEY }}"
    codex exec --full-auto "update CHANGELOG for next release"
```

### 模型上下文协议（MCP）

通过在`~/.codex/config.toml`中定义一个`mcp_servers`部分，可以将 Codex CLI 配置为使用 MCP 服务器。它旨在反映 Claude 和 Cursor 等工具在其各自的 JSON 配置文件中的 mcpServers 定义方式，尽管 Codex 的格式略有不同，因为它使用的是 TOML 而不是 JSON，例如：

```bash
# IMPORTANT: the top-level key is `mcp_servers` rather than `mcpServers`.
[mcp_servers.server-name]
command = "npx"
args = ["-y", "mcp-server"]
env = { "API_KEY" = "value" }
```

## 参考资料

[Codex官方详细配置说明文档](https://github.com/openai/codex/blob/main/docs/config.md#config)
