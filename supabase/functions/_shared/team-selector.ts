import { anthropic } from './anthropic.ts'
import { fetchAgentsBySquads, extractExpertise, SelectedAgent } from './registry.ts'

export interface TeamSelection {
  brand: SelectedAgent[]
  copy: SelectedAgent[]
  design: SelectedAgent[]
  engineering: SelectedAgent[]
  [key: string]: SelectedAgent[]
}

interface AgentPick {
  id: string
  role: string
}

interface TeamPicks {
  brand: AgentPick[]
  copy: AgentPick[]
  design: AgentPick[]
  engineering: AgentPick[]
}

const SQUAD_MAP = {
  brand: ['brand', 'brand-squad', 'brand-identity', 'movement', 'advisory-board'],
  copy: ['copy', 'copy-squad', 'hormozi', 'storytelling'],
  design: ['design', 'design-squad'],
  engineering: ['engineering', 'tech-product', 'specialized'],
}

export async function selectTeam(
  vision: string,
  clarification?: string
): Promise<TeamSelection> {
  const [brandCandidates, copyCandidates, designCandidates, engCandidates] =
    await Promise.all([
      fetchAgentsBySquads(SQUAD_MAP.brand),
      fetchAgentsBySquads(SQUAD_MAP.copy),
      fetchAgentsBySquads(SQUAD_MAP.design),
      fetchAgentsBySquads(SQUAD_MAP.engineering),
    ])

  const prompt = `Você é o Orchestrator da plataforma Fifty-Fifty.
Analise a visão do usuário e escolha 1-2 agentes por fase que melhor se encaixam.

Visão: "${vision}"
${clarification ? `Contexto adicional: "${clarification}"` : ''}

AGENTES DISPONÍVEIS:

FASE BRAND (escolha 1-2):
${brandCandidates.map(a => `- id: "${a.id}" | nome: ${a.name} | ${a.description}`).join('\n')}

FASE COPY (escolha 1-2):
${copyCandidates.map(a => `- id: "${a.id}" | nome: ${a.name} | ${a.description}`).join('\n')}

FASE DESIGN (escolha 1-2):
${designCandidates.map(a => `- id: "${a.id}" | nome: ${a.name} | ${a.description}`).join('\n')}

FASE ENGINEERING (escolha 1-2):
${engCandidates.map(a => `- id: "${a.id}" | nome: ${a.name} | ${a.description}`).join('\n')}

Retorne SOMENTE JSON válido:
{
  "brand": [{"id": "agent-id", "role": "papel neste projeto"}],
  "copy": [{"id": "agent-id", "role": "papel neste projeto"}],
  "design": [{"id": "agent-id", "role": "papel neste projeto"}],
  "engineering": [{"id": "agent-id", "role": "papel neste projeto"}]
}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Team selector: resposta inesperada')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Team selector: JSON não encontrado')

  const picks: TeamPicks = JSON.parse(jsonMatch[0])

  const allCandidates = [...brandCandidates, ...copyCandidates, ...designCandidates, ...engCandidates]

  function buildSelected(phasePicks: AgentPick[]): SelectedAgent[] {
    return phasePicks.map(pick => {
      const agent = allCandidates.find(a => a.id === pick.id)
      if (!agent) return null
      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        squad: agent.squad,
        role: pick.role,
        expertise: extractExpertise(agent.content),
      }
    }).filter(Boolean) as SelectedAgent[]
  }

  return {
    brand: buildSelected(picks.brand),
    copy: buildSelected(picks.copy),
    design: buildSelected(picks.design),
    engineering: buildSelected(picks.engineering),
  }
}

export function formatTeamContext(agents: SelectedAgent[]): string {
  return agents.map(a =>
    `### ${a.emoji} ${a.name} (${a.role})\n${a.expertise}`
  ).join('\n\n')
}
