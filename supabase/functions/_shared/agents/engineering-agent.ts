import { anthropic } from '../anthropic.ts'
import { BrandOutput, CopyOutput, DesignOutput } from '../types.ts'

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '4px',
  lg: '12px',
  full: '9999px',
}

const SPACING_MAP: Record<string, string> = {
  compact: '4rem',
  comfortable: '7rem',
  spacious: '10rem',
}

export async function runEngineeringAgent(
  brand: BrandOutput,
  copy: CopyOutput,
  design: DesignOutput,
  teamContext?: string,
  refineFeedback?: string
): Promise<string> {
  const radius = BORDER_RADIUS_MAP[design.style.borderRadius] ?? '8px'
  const sectionPadding = SPACING_MAP[design.style.spacing] ?? '6rem'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Você é o Engineering Agent da plataforma Fifty-Fifty.
Sua missão: gerar uma landing page HTML completa, standalone, que materializa o DNA da marca.
${teamContext ? `\nSeu time de engenharia neste projeto:\n${teamContext}\n\nAplique os padrões e princípios desses especialistas no código gerado.\n` : ''}${refineFeedback ? `\n⚠️ REFINAMENTO OBRIGATÓRIO — a versão anterior foi reprovada pelo Score Agent:\n"${refineFeedback}"\nCorriga esse problema específico antes de qualquer outra coisa.\n` : ''}

REGRA ABSOLUTA: a página deve parecer feita sob medida para esta marca específica.
Nunca use layout genérico. Cada decisão visual deve refletir o arquétipo: ${brand.archetype}

Sistema de Design:
- Background: ${design.palette.background}
- Surface: ${design.palette.surface}
- Primary: ${design.palette.primary}
- Primary Foreground: ${design.palette.primaryForeground}
- Foreground: ${design.palette.foreground}
- Muted: ${design.palette.muted}
- Border: ${design.palette.border}
- Border Radius: ${radius}
- Section Padding: ${sectionPadding}
- Mood: ${design.style.mood}
- Heading Font: ${design.typography.headingFont}
- Body Font: ${design.typography.bodyFont}

Copy:
- Headline: ${copy.headline}
- Subheadline: ${copy.subheadline}
- CTA: ${copy.cta}
- Proposta de valor: ${copy.valueProposition}
- Copy de apoio: ${copy.supportingCopy}

Marca:
- Nome: ${brand.projectName}
- Público: ${brand.audience}
- Problema: ${brand.coreProblem}
- Personalidade: ${brand.personality.join(', ')}

Gere um HTML completo com:
1. <head> com Google Fonts para "${design.typography.headingFont}" e "${design.typography.bodyFont}"
2. CSS inline com variáveis CSS (:root) usando os tokens acima
3. Seção Hero: headline + subheadline + CTA + elemento visual (SVG ou CSS art)
4. Seção de 3 benefícios com ícones SVG
5. Seção de CTA final
6. Footer simples com o nome do projeto
7. Totalmente responsivo (mobile-first)
8. Zero dependência externa além do Google Fonts

Retorne SOMENTE o HTML completo começando com <!DOCTYPE html>`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Engineering Agent: resposta inesperada')

  const text = content.text.trim()
  const htmlMatch = text.match(/<!DOCTYPE html[\s\S]*<\/html>/i)
  return htmlMatch ? htmlMatch[0] : text
}
