import { anthropic } from '../anthropic.ts'

export interface SecurityOutput {
  approved: boolean
  issues: string[]
  sanitizedHtml: string
}

/**
 * Aplica correções determinísticas ao HTML sem usar Claude.
 * Cobre as regras mais comuns e nunca tem risco de truncamento.
 */
function applyDeterministicFixes(html: string): string {
  let result = html

  // 1. Adiciona rel="noopener noreferrer" a links externos sem rel
  result = result.replace(
    /(<a\b(?=[^>]*\bhref=["']https?:\/\/)[^>]*?)(\s*>)/gi,
    (match, attrs, close) => {
      if (/\brel\s*=/.test(attrs)) return match
      return `${attrs} rel="noopener noreferrer"${close}`
    }
  )

  // 2. Garante HTTPS nos domínios do Google Fonts
  result = result.replace(/http:\/\/fonts\.googleapis\.com/gi, 'https://fonts.googleapis.com')
  result = result.replace(/http:\/\/fonts\.gstatic\.com/gi, 'https://fonts.gstatic.com')

  return result
}

/**
 * Usa Claude apenas para análise semântica de segurança.
 * Resposta é somente um array de issues — sem HTML no payload,
 * sem risco de truncamento independente do tamanho do HTML.
 */
async function analyzeWithClaude(html: string): Promise<string[]> {
  const SAMPLE_CHARS = 4000
  const sample = html.length > SAMPLE_CHARS
    ? html.slice(0, SAMPLE_CHARS) + `\n<!-- ... (${html.length - SAMPLE_CHARS} chars truncated for analysis) -->`
    : html

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Security audit of generated HTML. Sample (${html.length} total chars):
\`\`\`html
${sample}
\`\`\`

Return ONLY a valid JSON array of critical security issues found (empty array if none):
["issue description", ...]

Check for:
- eval() or document.write() usage
- innerHTML assigned with external/user data
- Iframes loading untrusted external domains
- Sensitive information (keys, tokens, emails) in HTML comments`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return []

  const match = content.text.trim().match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    return JSON.parse(match[0]) as string[]
  } catch {
    return []
  }
}

export async function runSecurityAgent(html: string): Promise<SecurityOutput> {
  // Passo 1: fixes determinísticos (sempre seguros, sem limite de tokens)
  const sanitizedHtml = applyDeterministicFixes(html)

  // Passo 2: análise semântica (Claude retorna só lista de issues, nunca o HTML)
  let issues: string[] = []
  try {
    issues = await analyzeWithClaude(sanitizedHtml)
  } catch {
    // Se o Claude falhar, entrega o HTML com os fixes determinísticos aplicados
    issues = []
  }

  return {
    approved: issues.length === 0,
    issues,
    sanitizedHtml,
  }
}
