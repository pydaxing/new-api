export type DocItem = {
  slug: string
  title: string
  file: string
}

export type DocCategory = {
  title: string
  items: DocItem[]
}

export const docsStructure: DocCategory[] = [
  {
    title: '使用教程',
    items: [
      { slug: 'compatibility', title: '前言-模型兼容性（必读）', file: '01-compatibility.md' },
      { slug: 'openai-sdk', title: 'OpenAI官方SDK使用教程', file: '02-openai-sdk.md' },
      { slug: 'batch-requests', title: '高并发批量请求示例', file: '03-batch-requests.md' },
      { slug: 'claude-code', title: 'Claude Code 配置教程', file: '04-claude-code.md' },
      { slug: 'openai-codex', title: 'OpenAI Codex 配置教程', file: '05-openai-codex.md' },
      { slug: 'gemini-cli', title: 'Gemini CLI 配置教程', file: '06-gemini-cli.md' },
      { slug: 'openclaw', title: 'OpenClaw 配置教程', file: '07-openclaw.md' },
      { slug: 'opencode', title: 'OpenCode 配置教程', file: '08-opencode.md' },
      { slug: 'trae', title: 'Trae 配置教程', file: '09-trae.md' },
      { slug: 'cc-switch', title: 'CC Switch 配置教程', file: '10-cc-switch.md' },
    ],
  },
  {
    title: '模型信息',
    items: [
      { slug: 'list-models', title: '列出可用模型', file: '11-list-models.md' },
      { slug: 'get-model', title: '列出单个模型', file: '12-get-model.md' },
    ],
  },
  {
    title: '聊天模型（Chat）',
    items: [
      { slug: 'chat-general', title: '聊天接口（通用）', file: '13-chat-general.md' },
      { slug: 'chat-vision', title: '聊天接口（图片分析）', file: '14-chat-vision.md' },
      { slug: 'chat-functions', title: '聊天接口（函数调用）', file: '15-chat-functions.md' },
      { slug: 'chat-o1', title: '聊天接口（o1-o3系列）', file: '16-chat-o1.md' },
      { slug: 'gpt4o-all', title: 'gpt-4o-all 文件分析', file: '17-gpt4o-all.md' },
      { slug: 'gpt4-all', title: 'gpt-4-all 文件分析', file: '18-gpt4-all.md' },
      { slug: 'chat-completions', title: '聊天补全', file: '19-chat-completions.md' },
      { slug: 'claude-openai', title: 'Claude (OpenAI格式)', file: '20-claude-openai.md' },
      { slug: 'claude-native', title: 'Claude (原生格式)', file: '21-claude-native.md' },
      { slug: 'gemini-openai', title: 'Gemini (OpenAI格式)', file: '22-gemini-openai.md' },
      { slug: 'gemini-native', title: 'Gemini (原生格式)', file: '23-gemini-native.md' },
      { slug: 'gpts', title: 'GPTs', file: '24-gpts.md' },
    ],
  },
  {
    title: '内容审查',
    items: [
      { slug: 'moderation-text', title: '文本审查', file: '25-moderation-text.md' },
      { slug: 'moderation-image', title: '图片审查', file: '26-moderation-image.md' },
    ],
  },
  {
    title: '向量嵌入',
    items: [
      { slug: 'embeddings', title: '创建嵌入', file: '27-embeddings.md' },
    ],
  },
]

export function findDocBySlug(slug: string): { category: DocCategory; item: DocItem } | null {
  for (const category of docsStructure) {
    const item = category.items.find((i) => i.slug === slug)
    if (item) return { category, item }
  }
  return null
}

export function getDefaultSlug(): string {
  return docsStructure[0].items[0].slug
}
