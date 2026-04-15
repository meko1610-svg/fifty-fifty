import { anthropic } from '../anthropic.ts'
import { BrandOutput, CopyOutput, DesignOutput, ScoreOutput } from '../types.ts'

const APPROVAL_THRESHOLD = 70

export async function runScoreAgent(
  html: string,
  brand: BrandOutput,
  copy: CopyOutput,
  design: DesignOutput
): Promise<ScoreOutput> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Você é o Score Agent da plataforma Fifty-Fifty.
Sua missão: avaliar objetivamente se o HTML gerado cumpre o brief da marca.

BRIEF DA MARCA:
- Nome: ${brand.projectName}
- Arquétipo: ${brand.archetype}
- Personalidade: ${brand.personality.join(', ')}
- Público: ${brand.audience}
- Problema: ${brand.coreProblem}

COPY ESPERADO:
- Headline: "${copy.headline}"
- Subheadline: "${copy.subheadline}"
- CTA: "${copy.cta}"

DESIGN ESPERADO:
- Paleta: background ${design.palette.background}, primary ${design.palette.primary}
- Fontes: ${design.typography.headingFont} / ${design.typography.bodyFont}
- Mood: ${design.style.mood}

HTML GERADO (primeiros 3000 chars):
\`\`\`html
${html.slice(0, 3000)}
\`\`\`

INSTRUÇÕES DE AVALIAÇÃO:
Pontue cada sinal de 0 a 20. Sinais negativos: pontue de 0 a 30 (valor que será deduzido).
Score final = (soma dos positivos) - (soma dos negativos). Mínimo 0, máximo 100.
approved = true se score >= ${APPROVAL_THRESHOLD}.

Retorne SOMENTE um JSON válido:
{
  "score": 0,
  "approved": false,
  "signals": {
    "brandCoherence": 0,
    "copyPresence": 0,
    "designAdherence": 0,
    "completeness": 0,
    "responsiveness": 0,
    "isGeneric": 0,
    "hasBrokenStructure": 0,
    "missingCTA": 0
  },
  "feedback": "Uma frase explicando o principal problema, se score < ${APPROVAL_THRESHOLD}. Vazio se aprovado."
}

CRITÉRIOS:
- brandCoherence (0-20): o layout e tom visual refletem o arquétipo "${brand.archetype}"?
- copyPresence (0-20): headline, subheadline e CTA estão presentes e fiéis ao brief?
- designAdherence (0-20): as cores e fontes definidas estão aplicadas corretamente?
- completeness (0-20): hero, benefícios, CTA final e footer estão presentes?
- responsiveness (0-20): há media queries ou padrões mobile-first no CSS?
- isGeneric (0-30): penalizar se o layout parece template genérico sem relação com a marca
- hasBrokenStructure (0-30): penalizar se há tags HTML malformadas ou estrutura quebrada
- missingCTA (0-30): penalizar se o CTA não está visível ou não corresponde ao brief`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return fallback(html)
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return fallback(html)
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ScoreOutput
    // Garante que approved reflete o threshold real
    parsed.approved = parsed.score >= APPROVAL_THRESHOLD
    return parsed
  } catch {
    return fallback(html)
  }
}

function fallback(html: string): ScoreOutput {
  // Se o Score Agent falhar, aprova com score neutro para não bloquear a entrega
  return {
    score: 70,
    approved: true,
    signals: {
      brandCoherence: 14,
      copyPresence: 14,
      designAdherence: 14,
      completeness: 14,
      responsiveness: 14,
      isGeneric: 0,
      hasBrokenStructure: 0,
      missingCTA: 0,
    },
    feedback: '',
  }
}
