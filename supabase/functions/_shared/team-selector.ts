import { anthropic } from './anthropic.ts'
import { fetchAgentsBySquads, extractExpertise, AgentRecord, SelectedAgent } from './registry.ts'

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

// Número máximo de candidatos por fase enviados ao Claude (Stage 2)
const STAGE_1_MAX = 8
const STAGE_1_MIN = 3

// Palavras que não contribuem para o match de agentes
const STOPWORDS = new Set([
  'para', 'com', 'uma', 'um', 'que', 'por', 'mais', 'como', 'mas', 'dos', 'das',
  'nos', 'nas', 'pelo', 'pela', 'este', 'esta', 'esse', 'essa', 'isso', 'meu',
  'minha', 'seu', 'sua', 'criar', 'quero', 'fazer', 'site', 'página', 'landing',
  'projeto', 'sobre', 'tipo', 'vou', 'preciso', 'queria', 'seria', 'tenho',
  'novo', 'nova', 'bom', 'boa', 'muito', 'pouco', 'também', 'ainda', 'onde',
])

/**
 * Stage 1 — Extrai palavras-chave significativas da visão do usuário.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

/**
 * Stage 1 — Pontua um agente com base em quantas keywords aparecem em sua descrição/id.
 */
function scoreAgent(agent: AgentRecord, keywords: string[]): number {
  const haystack = `${agent.id} ${agent.description} ${agent.squad}`.toLowerCase()
  return keywords.reduce((score, kw) => (haystack.includes(kw) ? score + 1 : score), 0)
}

/**
 * Stage 1 — Filtra e ordena candidatos por relevância.
 * Garante ao menos STAGE_1_MIN candidatos; se não houver suficientes com match,
 * completa com os restantes (sem descartar nenhum candidato disponível).
 */
function filterCandidates(agents: AgentRecord[], keywords: string[]): AgentRecord[] {
  if (keywords.length === 0 || agents.length <= STAGE_1_MAX) return agents

  const scored = agents
    .map(a => ({ agent: a, score: scoreAgent(a, keywords) }))
    .sort((a, b) => b.score - a.score)

  const relevant = scored.filter(x => x.score > 0).map(x => x.agent)
  const fallback = scored.filter(x => x.score === 0).map(x => x.agent)

  const filtered = [...relevant, ...fallback].slice(0, STAGE_1_MAX)

  // Se o filtro ficou apertado demais, usa todos os candidatos
  return filtered.length >= STAGE_1_MIN ? filtered : agents
}

export async function selectTeam(
  vision: string,
  clarification?: string
): Promise<TeamSelection> {
  // Busca todos os candidatos por fase em paralelo
  const [brandAll, copyAll, designAll, engAll] = await Promise.all([
    fetchAgentsBySquads(SQUAD_MAP.brand),
    fetchAgentsBySquads(SQUAD_MAP.copy),
    fetchAgentsBySquads(SQUAD_MAP.design),
    fetchAgentsBySquads(SQUAD_MAP.engineering),
  ])

  // Stage 1: filtro por keywords — reduz candidatos antes de chamar Claude
  const fullText = [vision, clarification].filter(Boolean).join(' ')
  const keywords = extractKeywords(fullText)

  const brandCandidates = filterCandidates(brandAll, keywords)
  const copyCandidates  = filterCandidates(copyAll, keywords)
  const designCandidates = filterCandidates(designAll, keywords)
  const engCandidates   = filterCandidates(engAll, keywords)

  // Stage 2: Claude escolhe 1-2 por fase a partir da lista reduzida
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

  const allCandidates = [...brandAll, ...copyAll, ...designAll, ...engAll]

  function buildSelected(phasePicks: AgentPick[]): SelectedAgent[] {
    return phasePicks
      .map(pick => {
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
      })
      .filter(Boolean) as SelectedAgent[]
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
