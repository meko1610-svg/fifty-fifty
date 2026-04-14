// ─── Contratos entre agentes ─────────────────────────────────────────────────

export interface BrandOutput {
  projectName: string
  personality: string[]      // ["direto", "confiável", "sem frescura"]
  tone: string               // "informal mas competente"
  audience: string           // "universitários que dividem apartamento"
  coreProblem: string        // "controlar gastos sem estresse"
  emotionalKeywords: string[] // ["clareza", "paz", "controle"]
  archetype: string          // "O Simplificador"
}

export interface CopyOutput {
  headline: string           // "Seus gastos. Na mesma página."
  subheadline: string        // "Chega de confusão no fim do mês."
  cta: string                // "Começar agora"
  valueProposition: string   // 2-3 frases de valor
  supportingCopy: string     // linha de apoio
}

export interface DesignOutput {
  palette: {
    background: string       // "#0F0F0F"
    surface: string          // "#1A1A1A"
    primary: string          // "#4CAF50"
    primaryForeground: string
    foreground: string
    muted: string
    border: string
  }
  typography: {
    headingFont: string      // nome Google Fonts
    bodyFont: string
    headingWeight: string    // "700"
  }
  style: {
    borderRadius: string     // "none" | "sm" | "lg" | "full"
    spacing: string          // "compact" | "comfortable" | "spacious"
    mood: string             // "dark" | "light"
  }
}

export interface EngineeringOutput {
  html: string               // HTML completo, standalone
}

export interface PipelineResult {
  brand: BrandOutput
  copy: CopyOutput
  design: DesignOutput
  html: string
}

// ─── Visão enviada pelo usuário ───────────────────────────────────────────────

// Visão enviada pelo usuário
export interface VisionSubmission {
  content: string
  attachments?: string[]
}

// Fases visíveis da orquestração
export type OrchestrationPhase =
  | 'reading'               // "Lendo o que você trouxe..."
  | 'understanding'         // "Entendendo o contexto..."
  | 'selecting-team'        // "Escolhendo a equipe certa..."
  | 'thinking-unique'       // "Pensando em como tornar isso único..."
  | 'defining-personality'  // "Definindo a personalidade do projeto..."
  | 'team-formed'           // "Time formado."
  | 'needs-clarification'   // pergunta de condução
  | 'executing'             // agentes trabalhando
  | 'delivered'             // pronto

export const ORCHESTRATION_MESSAGES: Record<OrchestrationPhase, string> = {
  'reading': 'Lendo o que você trouxe...',
  'understanding': 'Entendendo o contexto...',
  'selecting-team': 'Escolhendo a equipe certa...',
  'thinking-unique': 'Pensando em como tornar isso único...',
  'defining-personality': 'Definindo a personalidade do projeto...',
  'team-formed': 'Time formado.',
  'needs-clarification': '',
  'executing': 'Construindo...',
  'delivered': 'Pronto.',
}

export const ORCHESTRATION_SEQUENCE: OrchestrationPhase[] = [
  'reading',
  'understanding',
  'selecting-team',
  'thinking-unique',
  'defining-personality',
  'team-formed',
]

export const ORCHESTRATION_DELAYS: Record<OrchestrationPhase, number> = {
  'reading': 0,
  'understanding': 1500,
  'selecting-team': 3300,
  'thinking-unique': 5300,
  'defining-personality': 7500,
  'team-formed': 9500,
  'needs-clarification': 11000,
  'executing': 0,
  'delivered': 0,
}

export interface OrchestrationState {
  phase: OrchestrationPhase
  completedPhases: OrchestrationPhase[]
  question?: GuidingQuestion
  brief?: ProjectBrief
}

// Brief produzido pela orquestração
export interface ProjectBrief {
  title: string
  description: string
  personality: string
  visualDNA: string[]
  audience: string
  coreProblem: string
}

// Pergunta de condução (nunca técnica)
export interface GuidingQuestion {
  id: string
  text: string
}

// Projeto completo
export interface Project {
  id: string
  userId: string
  vision: string
  brief?: ProjectBrief
  status: 'orchestrating' | 'briefing' | 'executing' | 'delivered'
  createdAt: Date
  deliveredAt?: Date
}

// Resposta da API /api/orchestrate
export interface OrchestrateResponse {
  projectId: string
  needsClarification: boolean
  question?: GuidingQuestion
  brief?: ProjectBrief
}

// Evento SSE do stream de orquestração
export interface StreamEvent {
  type: 'phase' | 'question' | 'brief' | 'error'
  phase?: OrchestrationPhase
  question?: GuidingQuestion
  brief?: ProjectBrief
  error?: string
}
