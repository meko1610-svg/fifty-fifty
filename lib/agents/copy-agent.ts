import { anthropic } from '@/lib/anthropic'
import { BrandOutput, CopyOutput } from '@/lib/types'

export async function runCopyAgent(brand: BrandOutput, teamContext?: string): Promise<CopyOutput> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Você é o Copy Agent da plataforma Fifty-Fifty.
Sua missão: escrever copy que capture a essência da marca com precisão cirúrgica.
${teamContext ? `\nSeu time de especialistas em copy:\n${teamContext}\n\nEscreva no nível desses mestres.\n` : ''}

DNA da marca:
- Nome: ${brand.projectName}
- Personalidade: ${brand.personality.join(', ')}
- Tom: ${brand.tone}
- Público: ${brand.audience}
- Problema central: ${brand.coreProblem}
- Palavras emocionais: ${brand.emotionalKeywords.join(', ')}
- Arquétipo: ${brand.archetype}

Regras:
- Headline: máximo 8 palavras, impacto imediato, sem clichê
- Subheadline: máximo 15 palavras, complementa a headline
- CTA: máximo 3 palavras, ação clara
- O copy deve soar como ${brand.archetype}, não como um template

Retorne SOMENTE um JSON válido:
{
  "headline": "...",
  "subheadline": "...",
  "cta": "...",
  "valueProposition": "2-3 frases explicando o valor de forma concreta",
  "supportingCopy": "uma linha de apoio que reforça a proposta"
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Copy Agent: resposta inesperada')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Copy Agent: JSON não encontrado')

  return JSON.parse(jsonMatch[0]) as CopyOutput
}
