import { anthropic } from '../anthropic.ts'
import { BrandOutput, DesignOutput } from '../types.ts'

export async function runDesignAgent(brand: BrandOutput, teamContext?: string): Promise<DesignOutput> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Você é o Design Agent da plataforma Fifty-Fifty.
Sua missão: criar um sistema visual único derivado do DNA da marca.
${teamContext ? `\nSeus especialistas de design neste projeto:\n${teamContext}\n\nDeixe a perspectiva deles guiar suas escolhas visuais.\n` : ''}

REGRA ABSOLUTA: dois projetos NUNCA podem ter a mesma paleta.
Derive as cores a partir das palavras emocionais e personalidade.

DNA da marca:
- Personalidade: ${brand.personality.join(', ')}
- Tom: ${brand.tone}
- Palavras emocionais: ${brand.emotionalKeywords.join(', ')}
- Arquétipo: ${brand.archetype}

Diretrizes:
- mood "dark" para marcas sérias, introspectivas, premium
- mood "light" para marcas abertas, acolhedoras, energéticas
- borderRadius "none" para marcas diretas e precisas
- borderRadius "lg" para marcas amigáveis e acessíveis
- borderRadius "full" para marcas modernas e fluidas
- Escolha Google Fonts que reflitam o tom (não use Inter para tudo)

Retorne SOMENTE um JSON válido:
{
  "palette": {
    "background": "#hex",
    "surface": "#hex",
    "primary": "#hex",
    "primaryForeground": "#hex",
    "foreground": "#hex",
    "muted": "#hex",
    "border": "#hex"
  },
  "typography": {
    "headingFont": "Nome da Fonte",
    "bodyFont": "Nome da Fonte",
    "headingWeight": "700"
  },
  "style": {
    "borderRadius": "none | sm | lg | full",
    "spacing": "compact | comfortable | spacious",
    "mood": "dark | light"
  }
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Design Agent: resposta inesperada')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Design Agent: JSON não encontrado')

  return JSON.parse(jsonMatch[0]) as DesignOutput
}
