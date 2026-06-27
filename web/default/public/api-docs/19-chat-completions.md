# 聊天补全

## 接口信息

- **请求方式**: `POST`
- **请求路径**: `/v1/completions`

## 认证方式

请求头添加 `Authorization: Bearer YOUR_API_KEY`


## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 |
| `messages` | array | 是 |  |
| `temperature` | integer | 否 | 温度 - 使用什么采样温度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如 0.2）将使输出更加集中和确定。 我们通常建议改变这个或`top_p`但不是两者同时使用。 |
| `top_p` | integer | 否 | 一种替代温度采样的方法，称为核采样，其中模型考虑具有 top_p 概率质量的标记的结果。所以 0.1 意味着只考虑构成前 10% 概率质量的标记。 我们通常建议改变这个或`temperature`但不是两者同时使用。 |
| `stream` | boolean | 否 | 流式输出 - 流式输出或非流式输出 |
| `max_tokens` | number | 否 | 最大回复 - 聊天完成时生成的最大Tokens数量。 输入标记和生成标记的总长度受模型上下文长度的限制。 |
| `n` | number | 否 | 为每个输入消息生成多少个聊天完成选项。 |
| `presence_penalty` | integer | 否 | -2.0 和 2.0 之间的数字。正值会根据到目前为止是否出现在文本中来惩罚新标记，从而增加模型谈论新主题的可能性。 |
| `frequency_penalty` | integer | 否 | -2.0 和 2.0 之间的数字。正值会根据新标记在文本中的现有频率对其进行惩罚，从而降低模型逐字重复同一行的可能性。 |
| `logit_bias` | null | 否 | 修改指定标记出现在完成中的可能性。 接受一个 json 对象，该对象将标记（由标记器中的标记 ID 指定）映射到从 -100 到 100 的关联偏差值。从数学上讲，偏差会在采样之前添加到模型生成的 logits 中。确切的效果因模型而异，但 |
| `user` | string | 否 | 代表您的最终用户的唯一标识符，可以帮助 OpenAI 监控和检测滥用行为。[了解更多](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids) |

## 请求示例

```bash
curl https://pydaxing.com/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "gpt-3.5-turbo-instruct",
  "temperature": 0.7,
  "max_tokens": 100,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "prompt": "天气非常好",
  "logprobs": 1
}'
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://pydaxing.com/v1"
)

# 请根据具体接口调用相应方法
# 参考: https://github.com/openai/openai-python
```

## 响应示例

```json
{
  "id": "cmpl-A1tJLfyQgj1j2GpvhA6QcMCZKwRtw",
  "object": "text_completion",
  "created": 1725014307,
  "model": "gpt-3.5-turbo-instruct",
  "choices": [
    {
      "text": "，适合出门旅行\n\n\n\nYes, the weather is very good today, perfect for a trip.",
      "index": 0,
      "logprobs": {
        "tokens": [
          "，",
          "bytes:\\xe9\\x80",
          "bytes:\\x82",
          "合",
          "出",
          "门",
          "bytes:\\xe6\\x97",
          "bytes:\\x85",
          "行",
          "\n\n",
          "\n\n",
          "Yes",
          ",",
          " the",
          " weather",
          " is",
          " very",
          " good",
          " today",
          ",",
          " perfect",
          " for",
          " a",
          " trip",
          "."
        ],
        "token_logprobs": [
          -0.8015664,
          -2.9169734,
          -0.0111257555,
          -0.053733885,
          -0.78531545,
          -0.9327129,
          -1.958352,
          -0.000043226137,
          -1.355173,
          -2.9879627,
          -3.235125,
          -3.9541612,
          -0.007757815,
          -0.08989862,
          -0.000045491004,
          -0.0013639278,
          -0.32100397,
          -1.1380858,
          -0.97817147,
          -0.15390687,
          -0.25740996,
          -0.0001373897,
          -1.630863,
          -0.292718,
          -0.38636762
        ],
        "top_logprobs": [
          {
            "，": -0.8015664
          },
          {
            "我": -2.431496
          },
          {
            "bytes:\\x82": -0.0111257555
          },
          {
            "合": -0.053733885
          },
          {
            "出": -0.78531545
          },
          {
            "门": -0.9327129
          },
          {
            "游": -1.108056
          },
          {
            "bytes:\\x85": -0.000043226137
          },
          {
            "游": -0.3043021
          },
          {
            "。": -1.4599112
          },
          {
            "\n": -2.661734
          },
          {
            "是": -0.9270617
          },
          {
            ",": -0.007757815
          },
          {
            " the": -0.08989862
          },
          {
            " weather": -0.000045491004
          },
          {
            " is": -0.0013639278
          },
          {
            " very": -0.32100397
          },
          {
            " nice": -0.39199966
          },
          {
            ",": -0.9151126
          },
          {
            ",": -0.15390687
          },
          {
            " perfect": -0.25740996
          },
          {
            " for": -0.0001373897
          },
          {
            " going": -0.63430005
          },
          {
            " trip": -0.292718
          },
          {
            ".": -0.38636762
          }
        ],
        "text_offset": [
          5,
          6,
          6,
          7,
          8,
          9,
          10,
          10,
          11,
          12,
          14,
          16,
          19,
          20,
          24,
          32,
          35,
          40,
          45,
          51,
          52,
          60,
          64,
          66,
          71
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 25,
    "total_tokens": 31
  }
}
```