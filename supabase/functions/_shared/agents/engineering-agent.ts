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

/**
 * Traduz o arquétipo de marca em diretrizes visuais concretas para o HTML.
 * Correspondência por substring para tolerar variações do Brand Agent
 * (ex: "O Herói", "Herói", "Hero").
 */
function getArchetypeVisualDNA(archetype: string): string {
  const lower = archetype.toLowerCase()

  if (lower.includes('inocente') || lower.includes('innocent')) {
    return `ARQUÉTIPO — O Inocente:
Layout limpo com muito espaço negativo. Tipografia arredondada e amigável (font-weight 400-500).
Border-radius generoso em todos os elementos (≥ 16px). Animações suaves: fade-in, gentle float.
Sombras muito sutis. Cores pastéis mesmo quando a paleta primária é mais forte.
Sensação final: seguro, acolhedor, puro.`
  }

  if (lower.includes('explorador') || lower.includes('explorer')) {
    return `ARQUÉTIPO — O Explorador:
Layout assimétrico — quebre a grade propositalmente em pelo menos uma seção.
Use clip-path: polygon() para criar seções com bordas anguladas.
Tipografia com personalidade: pesos variados (400 e 800 no mesmo bloco).
Textura sutil via CSS (background-image: noise ou gradiente granular).
Sensação final: aventureiro, livre, descoberta.`
  }

  if (lower.includes('sábio') || lower.includes('sage') || lower.includes('sabio')) {
    return `ARQUÉTIPO — O Sábio:
Grid estruturado e preciso. Whitespace abundante — o silêncio comunica autoridade.
Tipografia com escala clara: headings 800, subheadings 500, body 400.
letter-spacing positivo no body (0.01em), negativo nos headings grandes (-0.02em).
Cores neutras com um único acento preciso. Sem ornamentos desnecessários.
Sensação final: confiança, profundidade, clareza intelectual.`
  }

  if (lower.includes('herói') || lower.includes('hero') || lower.includes('heroi')) {
    return `ARQUÉTIPO — O Herói:
Tipografia bold e impactante — headings em font-weight 900, tamanho máximo.
Alto contraste entre fundo e texto. Formas angulares e diagonais no CSS.
CTA proeminente com sombra colorida: box-shadow: 0 8px 32px {primary}60.
Animações com energia: slide-in rápido (0.15s), scale(1.04) no hover.
Sensação final: poder, conquista, ação imediata.`
  }

  if (lower.includes('fora-da-lei') || lower.includes('outlaw') || lower.includes('rebelde')) {
    return `ARQUÉTIPO — O Fora-da-Lei:
Dark theme. Tipografia pesada e condensada. Border-radius: 0 — sem curvas.
Cores saturadas em contraste brutal com fundo escuro.
Layout que desafia convenções: elementos sobrepostos, alinhamentos quebrados.
Texto em uppercase nos headings. Sensação final: rebeldia, autenticidade, ruptura.`
  }

  if (lower.includes('mago') || lower.includes('magician') || lower.includes('wizard')) {
    return `ARQUÉTIPO — O Mago:
Gradientes profundos e misteriosos como plano de fundo.
Elementos com glow via box-shadow: 0 0 40px {primary}40.
Tipografia com letter-spacing generoso (0.05em) nos headings.
Transições longas e fluidas (0.5s). Elementos que "flutuam" com animation: float.
Camadas de profundidade com z-index e blur sutil (backdrop-filter).
Sensação final: transformação, mistério, possibilidade ilimitada.`
  }

  if (lower.includes('cara normal') || lower.includes('everyman') || lower.includes('comum')) {
    return `ARQUÉTIPO — O Cara Normal:
Layout familiar e confortável. Tipografia sans-serif peso médio (400-500), amigável.
Cores quentes e acolhedoras. Border-radius moderado (8-12px).
Espaçamento generoso mas não excessivo. Sem elementos que intimidam.
Sensação final: acessível, honesto, próximo de quem usa.`
  }

  if (lower.includes('amante') || lower.includes('lover')) {
    return `ARQUÉTIPO — O Amante:
Tipografia elegante com letter-spacing generoso (0.03em). Paleta rica e sensual.
Curvas e formas orgânicas: border-radius amplo, SVGs com curvas.
Cada elemento tem muito espaço para "respirar" (padding generoso).
Transições lentas e suaves (0.4s ease). Sombras delicadas com cor.
Sensação final: desejo, prazer, exclusividade.`
  }

  if (lower.includes('bobo') || lower.includes('jester') || lower.includes('palhaço')) {
    return `ARQUÉTIPO — O Bobo:
Cores vibrantes e inesperadas. Tipografia expressiva — pesos e tamanhos variados.
Elementos com rotações sutis (transform: rotate(-2deg)). Formas irregulares em CSS.
Animações com bounce (cubic-bezier elástico). Hierarquia que surpreende.
Sensação final: alegria, espontaneidade, leveza contagiante.`
  }

  if (lower.includes('cuidador') || lower.includes('caregiver') || lower.includes('protetor')) {
    return `ARQUÉTIPO — O Cuidador:
Paleta suave e calorosa. Tipografia arredondada e legível. Padding interno generoso.
Border-radius amplo (≥ 16px). Ícones com traço suave (stroke, não fill).
Animações gentis. Layout que "abraça" o conteúdo visualmente.
Sensação final: segurança, cuidado, calor humano.`
  }

  if (lower.includes('criador') || lower.includes('creator') || lower.includes('artista')) {
    return `ARQUÉTIPO — O Criador:
Layout com composição artística — assimetria intencional e deliberada.
Tipografia com personalidade forte: mixing de pesos e espaçamentos.
Elementos visuais elaborados em CSS/SVG que expressam criatividade.
Cada seção tem tratamento visual único — evite repetição de padrão.
Sensação final: originalidade, expressão, artesanato com intenção.`
  }

  if (lower.includes('governante') || lower.includes('ruler') || lower.includes('líder') || lower.includes('lider')) {
    return `ARQUÉTIPO — O Governante:
Grid rígido e preciso. Tipografia com autoridade: peso 700-900, serifada se possível.
Muito espaço entre elementos — nada "apertado". Hierarquia absoluta e clara.
Detalhes refinados: bordas finas (1px), sombras precisas, espaçamento consistente.
Paleta escura e premium. Sensação final: autoridade, prestígio, liderança.`
  }

  // Fallback genérico para arquétipos não mapeados
  return `ARQUÉTIPO — ${archetype}:
Traduza o arquétipo em escolhas visuais conscientes. Cada decisão de cor, tipografia
e espaçamento deve reforçar a essência do arquétipo. Evite qualquer elemento genérico.`
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
  const archetypeVisualDNA = getArchetypeVisualDNA(brand.archetype)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Você é o Engineering Agent da plataforma Fifty-Fifty.
Sua missão: gerar uma landing page HTML standalone que seja visivelmente superior a qualquer template genérico.
O resultado final deve impressionar — não apenas "funcionar".
${refineFeedback ? `\n⚠️ REFINAMENTO OBRIGATÓRIO — versão anterior reprovada pelo Score Agent:\n"${refineFeedback}"\nCorrija esse problema antes de qualquer outra coisa.\n` : ''}${teamContext ? `\nPRINCÍPIOS DO SEU TIME DE ENGENHARIA (aplicar como checklist):
${teamContext}
` : ''}
---

${archetypeVisualDNA}

---

PADRÃO DE QUALIDADE OBRIGATÓRIO:

TIPOGRAFIA FLUIDA:
- Use clamp() em todos os headings: font-size: clamp(2rem, 5vw, 4.5rem)
- Headings: font-weight 700-900, letter-spacing: -0.02em a -0.04em
- Body: font-weight 400, line-height: 1.65, letter-spacing: 0.01em
- Nunca use font-size fixo em headings sem clamp()

CSS AVANÇADO:
- Todos os tokens em CSS custom properties (:root)
- Transições em todos os elementos interativos: transition: all 0.25s ease
- Hover no CTA: scale(1.03) + sombra ampliada
- Sombras com cor da paleta: box-shadow: 0 20px 60px {primary}25
- Use CSS Grid para layout das seções principais

ACABAMENTO:
- Nenhuma seção pode parecer igual à anterior — variar composição e fundo
- Ícones SVG únicos e coerentes com o arquétipo (não ícones genéricos)
- Elemento visual no hero (SVG inline ou CSS art) que reforce a marca
- Footer com personalidade — não apenas "© 2025"

RESPONSIVIDADE:
- Mobile-first: estilos base para mobile, @media para desktop
- Grid: grid-template-columns: 1fr no mobile → repeat(3, 1fr) no desktop
- Imagens e SVGs com max-width: 100%

---

SISTEMA DE DESIGN:
--background: ${design.palette.background}
--surface: ${design.palette.surface}
--primary: ${design.palette.primary}
--primary-foreground: ${design.palette.primaryForeground}
--foreground: ${design.palette.foreground}
--muted: ${design.palette.muted}
--border: ${design.palette.border}
--radius: ${radius}
--section-padding: ${sectionPadding}
--mood: ${design.style.mood}
--heading-font: "${design.typography.headingFont}"
--body-font: "${design.typography.bodyFont}"

---

COPY:
Headline: ${copy.headline}
Subheadline: ${copy.subheadline}
CTA: ${copy.cta}
Proposta de valor: ${copy.valueProposition}
Copy de apoio: ${copy.supportingCopy}

---

MARCA:
Nome: ${brand.projectName}
Público: ${brand.audience}
Problema central: ${brand.coreProblem}
Personalidade: ${brand.personality.join(', ')}
Keywords emocionais: ${brand.emotionalKeywords.join(', ')}

---

ESTRUTURA OBRIGATÓRIA (nesta ordem):
1. <head>: Google Fonts para "${design.typography.headingFont}" e "${design.typography.bodyFont}" + meta viewport + meta description
2. Hero: elemento visual dominante + headline com clamp() + subheadline + CTA com hover state
3. Proposta de valor: 3 pilares com ícones SVG únicos (não genéricos) — fundo diferente do hero
4. Seção central: materializa visualmente o problema resolvido — use o copy de apoio
5. CTA final: contexto de por que agir agora + botão com urgência
6. Footer: nome do projeto + tagline curta com personalidade

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
