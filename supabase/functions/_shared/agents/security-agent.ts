import { anthropic } from '../anthropic.ts'

export interface SecurityOutput {
  approved: boolean
  issues: string[]
  sanitizedHtml: string
}

export async function runSecurityAgent(html: string): Promise<SecurityOutput> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Você é o Security Agent da plataforma Fifty-Fifty.
Sua missão: revisar e sanitizar o HTML gerado antes da entrega ao usuário.

Regras de segurança a aplicar:
1. Remover qualquer tag <script> com conteúdo suspeito (eval, document.write, innerHTML com input externo)
2. Remover atributos de event handler inline que acessem dados externos (onload com fetch, etc.)
3. Garantir que links externos usem rel="noopener noreferrer"
4. Remover iframes com src de domínios não confiáveis
5. Garantir que não há vazamento de informação sensível nos comentários HTML
6. Validar que o Google Fonts é carregado via HTTPS

HTML para revisar:
\`\`\`html
${html}
\`\`\`

Retorne SOMENTE um JSON válido:
{
  "approved": true,
  "issues": ["lista de problemas encontrados, vazia se nenhum"],
  "sanitizedHtml": "o HTML completo após sanitização (mesmo se aprovado)"
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Security Agent: resposta inesperada')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { approved: true, issues: [], sanitizedHtml: html }
  }

  try {
    return JSON.parse(jsonMatch[0]) as SecurityOutput
  } catch {
    return { approved: true, issues: [], sanitizedHtml: html }
  }
}
