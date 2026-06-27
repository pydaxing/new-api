# Gemini CLI最佳API配置教程指南

本指南将介绍如何安装和配置 Gemini CLI，使其通过 API 平台调用 AI 模型。Gemini CLI 是一款强大的 AI 编程助手，支持多种编程语言和开发环境。

## 安装 Gemini CLI

使用 npm 全局安装 Gemini CLI：

```bash
npm install -g @google/gemini-cli
```

## 获取ApiKey

**在v-api平台注册并充值**

进入网站 https://api.v3.cm 进行注册并充值，然后在“令牌管理”页面，复制apikey，后续需要用到。


## 配置 Gemini CLI

### 步骤 1：创建环境变量配置文件

根据您的操作系统，在以下位置创建 `.env` 文件：

**Windows**

```bash
C:\Users\<您的用户名>\.gemini\.env
```

**MacOs / Linux**

```bash
~/.gemini/.env
```

如果 `.gemini` 目录不存在，请先手动创建。然后在 `.env` 文件中添加以下内容：

```bash
GOOGLE_GEMINI_BASE_URL=https://api.v3.cm/
```

如果不成功，将`GOOGLE_GEMINI_BASE_URL`改成`https://api.v3.cm`

### 步骤 2：配置模型设置

在 `.gemini` 目录下创建`settings.json`文件（与 `.env` 文件同目录），添加以下配置：

```json
{
  "ide": {
    "hasSeenNudge": true
  },
  "security": {
    "auth": {
      "selectedType": "gemini-api-key"
    }
  },
  "base": {
    "modelConfig": {
      "generateContentConfig": {
        "temperature": 0,
        "topP": 1
      }
    }
  },
  "chat-base": {
    "extends": "base",
    "modelConfig": {
      "generateContentConfig": {
        "thinkingConfig": {
          "includeThoughts": true
        },
        "temperature": 1,
        "topP": 0.95,
        "topK": 64
      }
    }
  },
  "chat-base-2.5": {
    "extends": "chat-base",
    "modelConfig": {
      "generateContentConfig": {
        "thinkingConfig": {
          "thinkingBudget": 8192
        }
      }
    }
  },
  "chat-base-3": {
    "extends": "chat-base",
    "modelConfig": {
      "generateContentConfig": {
        "thinkingConfig": {
          "thinkingLevel": "HIGH"
        }
      }
    }
  },
  "gemini-3-pro-preview": {
    "extends": "chat-base-3",
    "modelConfig": {
      "model": "gemini-3-pro-preview"
    }
  },
  "gemini-2.5-pro": {
    "extends": "chat-base-2.5",
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  },
  "gemini-2.5-flash": {
    "extends": "chat-base-2.5",
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  },
  "gemini-2.5-flash-lite": {
    "extends": "chat-base-2.5",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite"
    }
  },
  "gemini-2.5-flash-base": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  },
  "classifier": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "maxOutputTokens": 1024,
        "thinkingConfig": {
          "thinkingBudget": 512
        }
      }
    }
  },
  "prompt-completion": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "temperature": 0.3,
        "maxOutputTokens": 16000,
        "thinkingConfig": {
          "thinkingBudget": 0
        }
      }
    }
  },
  "edit-corrector": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "thinkingConfig": {
          "thinkingBudget": 0
        }
      }
    }
  },
  "summarizer-default": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "maxOutputTokens": 2000
      }
    }
  },
  "summarizer-shell": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "maxOutputTokens": 2000
      }
    }
  },
  "web-search": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {
      "generateContentConfig": {
        "tools": [
          {
            "googleSearch": {}
          }
        ]
      }
    }
  },
  "web-fetch": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {
      "generateContentConfig": {
        "tools": [
          {
            "urlContext": {}
          }
        ]
      }
    }
  },
  "web-fetch-fallback": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "loop-detection": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "loop-detection-double-check": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  },
  "llm-edit-fixer": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "next-speaker-checker": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "chat-compression-3-pro": {
    "modelConfig": {
      "model": "gemini-3-pro-preview"
    }
  },
  "chat-compression-2.5-pro": {
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  },
  "chat-compression-2.5-flash": {
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  },
  "chat-compression-2.5-flash-lite": {
    "modelConfig": {
      "model": "gemini-2.5-flash-lite"
    }
  },
  "chat-compression-default": {
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  }
}
```

### 步骤 3：启动并配置 API Key

在终端中执行以下命令：

```bash
gemini
```

首次运行时，Gemini CLI 会引导您进行配置：

1. 选择认证方式：选择 API Key 认证
2. 输入 API Key：输入您从 Routin 平台获取的 API Key
3. 按回车键确认
配置完成后，您就可以开始使用 Gemini CLI 与 Routin API 平台交互了！

## 使用示例

置完成后，您可以直接在终端中使用 Gemini CLI：

```bash
# 启动交互式聊天
gemini

# 直接提问
gemini "如何在 Python 中读取 JSON 文件？"
```
