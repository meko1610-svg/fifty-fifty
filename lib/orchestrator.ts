import { runBrandAgent } from './agents/brand-agent'
import { runCopyAgent } from './agents/copy-agent'
import { runDesignAgent } from './agents/design-agent'
import { runEngineeringAgent } from './agents/engineering-agent'
import { runSecurityAgent } from './agents/security-agent'
import { selectTeam, formatTeamContext, TeamSelection } from './agents/team-selector'
import { PipelineResult, GuidingQuestion } from './types'
import { SelectedAgent } from './agents/registry'

interface OrchestrateInput {
  vision: string
  clarification?: string
  questionId?: string
}

interface OrchestrateResult {
  needsClarification: boolean
  question?: GuidingQuestion
  result?: PipelineResult
  team?: TeamSelection
}

function detectsLacuna(vision: string): GuidingQuestion | null {
  const lower = vision.toLowerCase()

  const isTooVague =
    vision.trim().split(' ').length < 6 &&
    !lower.includes('para') &&
    !lower.includes('quem')

  const hasNoAudience =
    !lower.includes('para') &&
    !lower.includes('meu') &&
    !lower.includes('minha') &&
    !lower.includes('empresa') &&
    !lower.includes('pessoas') &&
    !lower.includes('clientes') &&
    !lower.includes('usuário')

  if (isTooVague || hasNoAudience) {
    return {
      id: 'q-audience',
      text: 'Para quem é esse projeto — uso pessoal ou outras pessoas vão usar também?',
    }
  }

  return null
}

export async function orchestrate(input: OrchestrateInput): Promise<OrchestrateResult> {
  const { vision, clarification, questionId } = input

  if (!clarification && !questionId) {
    const lacuna = detectsLacuna(vision)
    if (lacuna) {
      return { needsClarification: true, question: lacuna }
    }
  }

  // Seleciona o time primeiro
  const team = await selectTeam(vision, clarification)

  // Brand Agent com contexto do time selecionado
  const brand = await runBrandAgent(vision, clarification, formatTeamContext(team.brand))

  // Copy e Design em paralelo, com seus respectivos times
  const [copy, design] = await Promise.all([
    runCopyAgent(brand, formatTeamContext(team.copy)),
    runDesignAgent(brand, formatTeamContext(team.design)),
  ])

  // Engineering com contexto completo do time de engenharia
  const rawHtml = await runEngineeringAgent(brand, copy, design, formatTeamContext(team.engineering))

  // Security Agent valida e sanitiza antes da entrega
  const security = await runSecurityAgent(rawHtml)
  const html = security.sanitizedHtml

  return {
    needsClarification: false,
    team,
    result: { brand, copy, design, html },
  }
}
