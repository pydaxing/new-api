/**
 * One-time script to process raw fetched docs into clean markdown.
 * Run: bun run scripts/process-docs.ts
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const CONTENT_DIR = join(import.meta.dir, '../src/features/docs/content')
const OUTPUT_DIR = join(import.meta.dir, '../public/api-docs')
const SITE_URL = 'https://pydaxing.com'

const URL_REPLACEMENTS = [
  ['https://api.gpt.ge', SITE_URL],
  ['https://api-gpt-ge.apifox.cn', SITE_URL],
  ['http://api.gpt.ge', SITE_URL],
] as const

function replaceUrls(content: string): string {
  let result = content
  for (const [from, to] of URL_REPLACEMENTS) {
    result = result.replaceAll(from, to)
  }
  return result
}

function filterCodeBlocks(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inCodeBlock = false
  let codeBlockLang = ''
  let skipBlock = false

  for (const line of lines) {
    if (!inCodeBlock && line.startsWith('```')) {
      inCodeBlock = true
      codeBlockLang = line.slice(3).trim().toLowerCase()
      const keepLangs = ['python', 'curl', 'bash', 'sh', 'shell', 'json', 'yaml', 'yml', 'text', '']
      skipBlock = !keepLangs.includes(codeBlockLang)
      if (!skipBlock) {
        // Normalize language names for syntax highlighting
        let lang = codeBlockLang
        if (lang === 'sh' || lang === 'shell' || lang === 'curl') lang = 'bash'
        result.push(lang ? `\`\`\`${lang}` : '```')
      }
    } else if (inCodeBlock && line.trimEnd() === '```') {
      inCodeBlock = false
      if (!skipBlock) {
        result.push('```')
      }
      skipBlock = false
      codeBlockLang = ''
    } else if (inCodeBlock) {
      if (!skipBlock) {
        result.push(line)
      }
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

function cleanTipBlocks(content: string): string {
  let result = content

  const types: [string, string][] = [
    ['tip', '提示'],
    ['caution', '注意'],
    ['warning', '警告'],
    ['danger', '危险'],
    ['info', '信息'],
  ]

  for (const [type, label] of types) {
    // Single-line: :::tip content :::
    result = result.replace(
      new RegExp(`:::${type}\\s+(.+?)\\s*:::`, 'g'),
      `> **${label}** $1`
    )

    // Multi-line with closing :::
    result = result.replace(
      new RegExp(`:::${type}\\s*\\n([\\s\\S]*?):::`, 'g'),
      (_match, inner) => {
        const lines = inner.trim().split('\n')
        return `> **${label}**\n>\n` + lines.map((l: string) => `> ${l}`).join('\n')
      }
    )

    // Opening :::tip with content on same line but NO closing ::: (rest of line is content)
    result = result.replace(
      new RegExp(`^:::${type}\\s+(.+)$`, 'gm'),
      `> **${label}** $1`
    )
  }

  // Leftover ::: (orphaned) - remove
  result = result.replace(/^:::\s*$/gm, '')

  return result
}

function cleanTabsBlocks(content: string): string {
  // Remove <Tabs> and </Tabs> tags
  let result = content.replace(/<\/?Tabs>/g, '')

  // Convert <Tab title="..."> to ### heading, remove </Tab>
  result = result.replace(/<Tab\s+title="([^"]+)">/g, '### $1')
  result = result.replace(/<\/Tab>/g, '')

  return result
}

interface YamlProperty {
  type?: string
  title?: string
  description?: string
  items?: { type?: string; properties?: Record<string, YamlProperty> }
  properties?: Record<string, YamlProperty>
  required?: string[]
  'x-apifox-mock'?: string
}

interface YamlOperation {
  summary?: string
  description?: string
  tags?: string[]
  parameters?: Array<{
    name: string
    in: string
    description?: string
    required?: boolean
    example?: string
    schema?: { type: string }
  }>
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: {
          type?: string
          properties?: Record<string, YamlProperty>
          required?: string[]
          'x-apifox-orders'?: string[]
        }
        example?: unknown
      }
    }
  }
  responses?: Record<string, {
    description?: string
    content?: {
      'application/json'?: {
        schema?: unknown
        example?: unknown
      }
    }
  }>
  security?: Array<Record<string, unknown>>
}

function formatParamTable(properties: Record<string, YamlProperty>, required: string[] = []): string {
  const rows: string[] = []
  rows.push('| 参数 | 类型 | 必填 | 说明 |')
  rows.push('|------|------|------|------|')

  for (const [name, prop] of Object.entries(properties)) {
    if (name.startsWith('x-apifox')) continue
    const isRequired = required.includes(name)
    const type = prop.type || 'object'
    const desc = (prop.title || '') + (prop.description ? (prop.title ? ' - ' : '') + prop.description.replace(/\n/g, ' ').slice(0, 120) : '')
    rows.push(`| \`${name}\` | ${type} | ${isRequired ? '是' : '否'} | ${desc} |`)
  }

  return rows.join('\n')
}

function yamlToMarkdown(yamlContent: string, title: string): string {
  let spec: any
  try {
    spec = parseYaml(yamlContent)
  } catch {
    return `# ${title}\n\n> 文档内容解析失败，请参考原始 OpenAPI 规范。\n`
  }

  const paths = spec?.paths || {}
  const sections: string[] = [`# ${title}`]

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods as Record<string, YamlOperation>)) {
      if (method.startsWith('x-')) continue

      const op = operation as YamlOperation
      const desc = op.description?.trim()

      sections.push(`\n## 接口信息\n`)
      sections.push(`- **请求方式**: \`${method.toUpperCase()}\``)
      sections.push(`- **请求路径**: \`${path}\``)
      if (desc) sections.push(`\n${desc}\n`)

      sections.push(`\n## 认证方式\n`)
      sections.push('请求头添加 `Authorization: Bearer YOUR_API_KEY`\n')

      // Request body
      const bodySchema = op.requestBody?.content?.['application/json']?.schema
      const bodyExample = op.requestBody?.content?.['application/json']?.example

      if (bodySchema?.properties) {
        sections.push(`\n## 请求参数\n`)
        sections.push(formatParamTable(bodySchema.properties, bodySchema.required || []))
      }

      // Request example
      if (bodyExample) {
        const exJson = JSON.stringify(bodyExample, null, 2)
        sections.push(`\n## 请求示例\n`)

        // curl example
        sections.push('```bash')
        sections.push(`curl ${SITE_URL}${path} \\`)
        sections.push(`  -H "Content-Type: application/json" \\`)
        sections.push(`  -H "Authorization: Bearer YOUR_API_KEY" \\`)
        sections.push(`  -d '${exJson}'`)
        sections.push('```\n')

        // python example
        sections.push('```python')
        sections.push('from openai import OpenAI\n')
        sections.push('client = OpenAI(')
        sections.push(`    api_key="YOUR_API_KEY",`)
        sections.push(`    base_url="${SITE_URL}/v1"`)
        sections.push(')\n')

        if (path.includes('chat/completions')) {
          const model = (bodyExample as any).model || 'gpt-4o'
          sections.push(`response = client.chat.completions.create(`)
          sections.push(`    model="${model}",`)
          sections.push(`    messages=[{"role": "user", "content": "你好"}],`)
          if ((bodyExample as any).stream !== undefined) {
            sections.push(`    stream=${(bodyExample as any).stream ? 'True' : 'False'},`)
          }
          sections.push(`)`)
          sections.push(`print(response.choices[0].message.content)`)
        } else if (path.includes('embeddings')) {
          const model = (bodyExample as any).model || 'text-embedding-3-large'
          sections.push(`response = client.embeddings.create(`)
          sections.push(`    model="${model}",`)
          sections.push(`    input="${(bodyExample as any).input || '示例文本'}"`)
          sections.push(`)`)
          sections.push(`print(response.data[0].embedding[:5])`)
        } else if (path.includes('moderations')) {
          sections.push(`response = client.moderations.create(`)
          sections.push(`    input="${(bodyExample as any).input || '示例文本'}"`)
          sections.push(`)`)
          sections.push(`print(response.results[0])`)
        } else if (path.includes('models')) {
          sections.push(`models = client.models.list()`)
          sections.push(`for model in models.data:`)
          sections.push(`    print(model.id)`)
        } else {
          sections.push(`# 请根据具体接口调用相应方法`)
          sections.push(`# 参考: https://github.com/openai/openai-python`)
        }
        sections.push('```')
      }

      // Response example
      const resp200 = op.responses?.['200']
      const respExample = resp200?.content?.['application/json']?.example
      if (respExample) {
        sections.push(`\n## 响应示例\n`)
        sections.push('```json')
        sections.push(JSON.stringify(respExample, null, 2))
        sections.push('```')
      }
    }
  }

  return sections.join('\n')
}

function processApiDoc(content: string): string {
  const title = content.match(/^#\s+(.+)/m)?.[1] || '文档'

  // Extract YAML from code block
  const yamlMatch = content.match(/```yaml\n([\s\S]*?)```/)
  if (!yamlMatch) {
    return filterCodeBlocks(cleanTabsBlocks(cleanTipBlocks(replaceUrls(content))))
  }

  const yamlContent = yamlMatch[1]
  let result = yamlToMarkdown(yamlContent, title)
  result = replaceUrls(result)
  result = cleanTipBlocks(result)
  return result
}

function processTutorialDoc(content: string): string {
  let processed = replaceUrls(content)
  processed = cleanTabsBlocks(processed)
  processed = filterCodeBlocks(processed)
  processed = cleanTipBlocks(processed)
  return processed
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  // Re-fetch raw files
  const docs = [
    { file: '01-compatibility.md', url: 'https://api-gpt-ge.apifox.cn/5069242m0.md' },
    { file: '02-openai-sdk.md', url: 'https://api-gpt-ge.apifox.cn/5071665m0.md' },
    { file: '03-batch-requests.md', url: 'https://api-gpt-ge.apifox.cn/5544907m0.md' },
    { file: '04-claude-code.md', url: 'https://api-gpt-ge.apifox.cn/7009817m0.md' },
    { file: '05-openai-codex.md', url: 'https://api-gpt-ge.apifox.cn/7738964m0.md' },
    { file: '06-gemini-cli.md', url: 'https://api-gpt-ge.apifox.cn/8044225m0.md' },
    { file: '07-openclaw.md', url: 'https://api-gpt-ge.apifox.cn/8185128m0.md' },
    { file: '08-opencode.md', url: 'https://api-gpt-ge.apifox.cn/8185131m0.md' },
    { file: '09-trae.md', url: 'https://api-gpt-ge.apifox.cn/9011159m0.md' },
    { file: '10-cc-switch.md', url: 'https://api-gpt-ge.apifox.cn/9011336m0.md' },
    { file: '11-list-models.md', url: 'https://api-gpt-ge.apifox.cn/220081913e0.md' },
    { file: '12-get-model.md', url: 'https://api-gpt-ge.apifox.cn/381327502e0.md' },
    { file: '13-chat-general.md', url: 'https://api-gpt-ge.apifox.cn/210153849e0.md' },
    { file: '14-chat-vision.md', url: 'https://api-gpt-ge.apifox.cn/215473722e0.md' },
    { file: '15-chat-functions.md', url: 'https://api-gpt-ge.apifox.cn/257673827e0.md' },
    { file: '16-chat-o1.md', url: 'https://api-gpt-ge.apifox.cn/215439574e0.md' },
    { file: '17-gpt4o-all.md', url: 'https://api-gpt-ge.apifox.cn/210332388e0.md' },
    { file: '18-gpt4-all.md', url: 'https://api-gpt-ge.apifox.cn/210324547e0.md' },
    { file: '19-chat-completions.md', url: 'https://api-gpt-ge.apifox.cn/210518190e0.md' },
    { file: '20-claude-openai.md', url: 'https://api-gpt-ge.apifox.cn/210337178e0.md' },
    { file: '21-claude-native.md', url: 'https://api-gpt-ge.apifox.cn/227164659e0.md' },
    { file: '22-gemini-openai.md', url: 'https://api-gpt-ge.apifox.cn/210339408e0.md' },
    { file: '23-gemini-native.md', url: 'https://api-gpt-ge.apifox.cn/381349186e0.md' },
    { file: '24-gpts.md', url: 'https://api-gpt-ge.apifox.cn/210340050e0.md' },
    { file: '25-moderation-text.md', url: 'https://api-gpt-ge.apifox.cn/283312580e0.md' },
    { file: '26-moderation-image.md', url: 'https://api-gpt-ge.apifox.cn/283312991e0.md' },
    { file: '27-embeddings.md', url: 'https://api-gpt-ge.apifox.cn/210513104e0.md' },
  ]

  console.log(`Fetching and processing ${docs.length} files...`)

  for (const { file, url } of docs) {
    const resp = await fetch(url)
    const content = await resp.text()

    const num = parseInt(file.split('-')[0])
    let processed: string

    if (num >= 11) {
      processed = processApiDoc(content)
    } else {
      processed = processTutorialDoc(content)
    }

    await writeFile(join(OUTPUT_DIR, file), processed)
    console.log(`  ✓ ${file}`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
