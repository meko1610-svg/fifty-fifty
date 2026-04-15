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

export interface PipelineResult {
  brand: BrandOutput
  copy: CopyOutput
  design: DesignOutput
  html: string
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
