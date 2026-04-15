'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Logo } from '@/components/ui/logo'
import { OrchestrationDisplay } from './OrchestrationDisplay'
import { GuidingQuestion } from '@/components/questions/GuidingQuestion'
import { BriefModal } from '@/components/project/BriefModal'
import { createClient } from '@/lib/supabase/client'
import {
  OrchestrationState,
  ORCHESTRATION_SEQUENCE,
  ORCHESTRATION_DELAYS,
  ProjectBrief,
} from '@/lib/types'

type UIState = 'idle' | 'orchestrating' | 'question' | 'brief'

// Mensagens exibidas enquanto cada agente trabalha
const AGENT_EXECUTING: Record<string, string> = {
  team:           'Definindo identidade...',
  brand:          'Criando copy e design...',
  'copy-design':  'Construindo o código...',
  engineering:    'Avaliando qualidade...',
  'engineering-retry': 'Refinando resultado...',
  score:          'Revisando segurança...',
  security:       'Finalizando...',
}

const AGENT_DONE: Record<string, string> = {
  brand:        'Identidade definida',
  'copy-design': 'Copy e design prontos',
  engineering:  'Código construído',
  score:        'Qualidade verificada',
  security:     'Segurança aprovada',
}

interface AgentStep {
  label: string
  done: boolean
}

export function VisionInput() {
  const router = useRouter()
  const supabase = createClient()

  const [vision, setVision] = useState('')
  const [uiState, setUiState] = useState<UIState>('idle')
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Record<string, { name: string; emoji: string; role: string }[]> | undefined>()
  const [showModal, setShowModal] = useState(false)
  const [orchestration, setOrchestration] = useState<OrchestrationState>({
    phase: 'reading',
    completedPhases: [],
  })
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isRetrying = useRef(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleSubmit() {
    const trimmed = vision.trim()
    if (!trimmed || uiState !== 'idle') return
    isRetrying.current = false
    setUiState('orchestrating')
    runOrchestrationAnimation(trimmed)
  }

  function runOrchestrationAnimation(submittedVision: string) {
    ORCHESTRATION_SEQUENCE.forEach((phase, index) => {
      const delay = ORCHESTRATION_DELAYS[phase]
      const nextPhase = ORCHESTRATION_SEQUENCE[index + 1]

      setTimeout(() => {
        setOrchestration((prev) => ({ ...prev, phase }))
      }, delay)

      if (nextPhase) {
        const nextDelay = ORCHESTRATION_DELAYS[nextPhase]
        setTimeout(() => {
          setOrchestration((prev) => ({
            ...prev,
            completedPhases: [...prev.completedPhases, phase],
          }))
        }, nextDelay - 100)
      }
    })

    const lastDelay = ORCHESTRATION_DELAYS['team-formed'] + 800
    setTimeout(() => {
      setOrchestration((prev) => ({
        ...prev,
        completedPhases: [...ORCHESTRATION_SEQUENCE],
        phase: 'team-formed',
      }))
      setCurrentStep('team')
      streamOrchestrate(submittedVision)
    }, lastDelay)
  }

  async function streamOrchestrate(submittedVision: string, body?: object) {
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: submittedVision, ...body }),
      })

      if (!res.ok || !res.body) throw new Error('stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const event = JSON.parse(part.slice(6))
          handleStreamEvent(event)
        }
      }
    } catch {
      // Fallback: pergunta de condução
      setOrchestration((prev) => ({
        ...prev,
        phase: 'needs-clarification',
        question: {
          id: 'q1',
          text: 'Para quem é esse projeto — uso pessoal ou outras pessoas vão acessar também?',
        },
      }))
      setCurrentStep(null)
      setUiState('question')
    }
  }

  function handleStreamEvent(event: Record<string, unknown>) {
    switch (event.type) {
      case 'team':
        setCurrentStep('brand')
        break

      case 'brand':
        setAgentSteps((prev) => [...prev, { label: AGENT_DONE['brand'], done: true }])
        setCurrentStep('copy-design')
        break

      case 'copy-design':
        setAgentSteps((prev) => [...prev, { label: AGENT_DONE['copy-design'], done: true }])
        setCurrentStep('engineering')
        break

      case 'engineering':
        if (isRetrying.current) {
          // Re-execução no retry — não duplica o step "Código construído"
          setCurrentStep('score')
        } else {
          setAgentSteps((prev) => [...prev, { label: AGENT_DONE['engineering'], done: true }])
          setCurrentStep('score')
        }
        break

      case 'score': {
        const { score, approved, retry } = event as { score: number; approved: boolean; retry: boolean }
        if (approved) {
          isRetrying.current = false
          setAgentSteps((prev) => [
            ...prev,
            { label: `Qualidade verificada · ${score}/100`, done: true },
          ])
          setCurrentStep('security')
        } else if (retry) {
          // Score abaixo do threshold — sinaliza retry, sem adicionar step duplicado
          isRetrying.current = true
          setCurrentStep('engineering-retry')
        } else {
          // Esgotou retries — entrega assim mesmo
          isRetrying.current = false
          setCurrentStep('security')
        }
        break
      }

      case 'security':
        setAgentSteps((prev) => [...prev, { label: AGENT_DONE['security'], done: true }])
        setCurrentStep(null)
        break

      case 'clarification':
        setOrchestration((prev) => ({
          ...prev,
          phase: 'needs-clarification',
          question: event.question as { id: string; text: string },
        }))
        setCurrentStep(null)
        setUiState('question')
        break

      case 'done': {
        const brief = event.brief as ProjectBrief
        setOrchestration((prev) => ({ ...prev, brief, phase: 'delivered' }))
        if (event.html) setGeneratedHtml(event.html as string)
        if (event.team) setSelectedTeam(event.team as Record<string, { name: string; emoji: string; role: string }[]>)
        if (event.projectId) setProjectId(event.projectId as string)
        setUiState('brief')
        setShowModal(true)
        break
      }
    }
  }

  async function handleAnswer(answer: string) {
    isRetrying.current = false
    setUiState('orchestrating')
    setAgentSteps([])
    setCurrentStep('team')
    setOrchestration((prev) => ({
      ...prev,
      phase: 'team-formed',
      question: undefined,
      completedPhases: [...ORCHESTRATION_SEQUENCE],
    }))

    await streamOrchestrate(vision, {
      clarification: answer,
      questionId: orchestration.question?.id,
    })
  }

  function handleConfirm() {
    setShowModal(false)
    if (projectId) {
      router.push(`/project/${projectId}`)
    } else if (generatedHtml) {
      const blob = new Blob([generatedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }

  const animationDone = orchestration.completedPhases.length === ORCHESTRATION_SEQUENCE.length

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="fixed top-6 left-6">
        <Logo size={72} />
      </div>

      <div className="fixed top-6 right-6 flex items-center gap-3">
        <Link href="/projects" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
          Projetos
        </Link>
        <button onClick={handleLogout} className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors">
          Sair
        </button>
      </div>

      {showModal && orchestration.brief && (
        <BriefModal
          brief={orchestration.brief}
          html={generatedHtml}
          team={selectedTeam}
          onConfirm={handleConfirm}
        />
      )}

      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {uiState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              <h1 className="text-2xl font-light text-neutral-100 tracking-tight">
                O que está em sua mente?
              </h1>

              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  className="resize-none bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-700 rounded-2xl text-base leading-relaxed min-h-[120px] pr-12 focus-visible:ring-0 focus-visible:border-neutral-600 transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleSubmit}
                  disabled={!vision.trim()}
                  className="absolute bottom-3 right-3 h-8 w-8 rounded-xl bg-neutral-100 hover:bg-white text-neutral-900 flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <div className="flex gap-3">
                <button className="text-neutral-600 hover:text-neutral-400 transition-colors p-1" title="Anexar imagem">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 12l3.5-4 2.5 3 2-2.5L14 12H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </button>
                <button className="text-neutral-600 hover:text-neutral-400 transition-colors p-1" title="Usar voz">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="6" y="1" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M3 8a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* ORCHESTRATING + QUESTION */}
          {(uiState === 'orchestrating' || uiState === 'question') && (
            <motion.div
              key="orchestrating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4"
              >
                <p className="text-neutral-300 text-sm leading-relaxed">{vision}</p>
              </motion.div>

              <OrchestrationDisplay
                currentPhase={orchestration.phase}
                completedPhases={orchestration.completedPhases}
              />

              {/* Progresso real dos agentes — aparece após a animação */}
              {animationDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2.5 pl-7"
                >
                  <AnimatePresence>
                    {agentSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2.5"
                      >
                        <span className="text-neutral-400 text-xs">✓</span>
                        <span className="text-xs text-neutral-500">{step.label}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {currentStep && (
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5"
                    >
                      <motion.span
                        className="block w-1.5 h-1.5 rounded-full bg-neutral-500 flex-shrink-0"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <span className="text-xs text-neutral-400">
                        {AGENT_EXECUTING[currentStep]}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {uiState === 'question' && orchestration.question && (
                <GuidingQuestion
                  question={orchestration.question}
                  onAnswer={handleAnswer}
                />
              )}
            </motion.div>
          )}

          {/* BRIEF */}
          {uiState === 'brief' && (
            <motion.div
              key="brief-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <motion.div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4">
                <p className="text-neutral-300 text-sm leading-relaxed">{vision}</p>
              </motion.div>
              <OrchestrationDisplay
                currentPhase="team-formed"
                completedPhases={[...ORCHESTRATION_SEQUENCE]}
              />
              <div className="flex flex-col gap-2.5 pl-7">
                {agentSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-neutral-400 text-xs">✓</span>
                    <span className="text-xs text-neutral-500">{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
