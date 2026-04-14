import { anthropic } from '@/lib/anthropic'
import { BrandOutput } from '@/lib/types'

export async function runBrandAgent(
  vision: string,
  clarification?: string,
  teamContext?: string
): Promise<BrandOutput> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Você é o Brand Agent da plataforma Fifty-Fifty.
${teamContext ? `\nSeu time de especialistas nesta fase:\n${teamContext}\n\nUse a perspectiva desses especialistas para enriquecer sua análise.\n` : ''}
Sua missão: extrair o DNA de marca a partir da visão do usuário.

Visão: "${vision}"
${clarification ? `Contexto adicional: "${clarification}"` : ''}

Regras:
- Nunca use palavras genéricas como "inovador" ou "moderno"
- A personalidade deve ser específica e memorável
- O arquétipo deve capturar a essência em duas palavras

Retorne SOMENTE um JSON válido com esta estrutura exata:
{
  "projectName": "nome do projeto",
  "personality": ["adjetivo1", "adjetivo2", "adjetivo3"],
  "tone": "uma frase descrevendo o tom de comunicação",
  "audience": "quem vai usar isso",
  "coreProblem": "o problema central resolvido",
  "emotionalKeywords": ["palavra1", "palavra2", "palavra3"],
  "archetype": "O [Nome do Arquétipo]"
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Brand Agent: resposta inesperada')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Brand Agent: JSON não encontrado')

  return JSON.parse(jsonMatch[0]) as BrandOutput
}
