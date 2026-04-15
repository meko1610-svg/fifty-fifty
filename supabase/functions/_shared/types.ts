export interface BrandOutput {
  projectName: string
  personality: string[]
  tone: string
  audience: string
  coreProblem: string
  emotionalKeywords: string[]
  archetype: string
}

export interface CopyOutput {
  headline: string
  subheadline: string
  cta: string
  valueProposition: string
  supportingCopy: string
}

export interface DesignOutput {
  palette: {
    background: string
    surface: string
    primary: string
    primaryForeground: string
    foreground: string
    muted: string
    border: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    headingWeight: string
  }
  style: {
    borderRadius: string
    spacing: string
    mood: string
  }
}

export interface ScoreSignals {
  // Positive (0–20 each, total 100)
  brandCoherence: number
  copyPresence: number
  designAdherence: number
  completeness: number
  responsiveness: number
  // Negative (deducted from total)
  isGeneric: number
  hasBrokenStructure: number
  missingCTA: number
}

export interface ScoreOutput {
  score: number           // 0–100
  approved: boolean       // score >= 70
  signals: ScoreSignals
  feedback: string        // one-sentence reason when score < 70
}

export interface PipelineResult {
  brand: BrandOutput
  copy: CopyOutput
  design: DesignOutput
  html: string
  score?: ScoreOutput
}

export interface GuidingQuestion {
  id: string
  text: string
}

export interface ProjectBrief {
  title: string
  description: string
  personality: string
  visualDNA: string[]
  audience: string
  coreProblem: string
}
