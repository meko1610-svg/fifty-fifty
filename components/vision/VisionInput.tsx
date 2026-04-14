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
  OrchestrationPhase,
  OrchestrationState,
  ORCHESTRATION_SEQUENCE,
  ORCHESTRATION_DELAYS,
} from '@/lib/types'

type UIState = 'idle' | 'orchestrating' | 'question' | 'brief'

export function VisionInput() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }
  const [vision, setVision] = useState('')
  const [uiState, setUiState] = useState<UIState>('idle')
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Record<string, { name: string; emoji: string; role: string }[]> | undefined>()
  const [isApiPending, setIsApiPending] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [orchestration, setOrchestration] = useState<OrchestrationState>({
    phase: 'reading',
    completedPhases: [],
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleSubmit() {
    const trimmed = vision.trim()
    if (!trimmed || uiState !== 'idle') return

    setUiState('orchestrating')
    runOrchestrationAnimation(trimmed)
  }

  function runOrchestrationAnimation(submittedVision: string) {
    // Anima cada fase em sequência
    ORCHESTRATION_SEQUENCE.forEach((phase, index) => {
      const delay = ORCHESTRATION_DELAYS[phase]
      const nextPhase = ORCHESTRATION_SEQUENCE[index + 1]

      // Ativa a fase atual
      setTimeout(() => {
        setOrchestration((prev) => ({ ...prev, phase }))
      }, delay)

      // Marca como completa quando a próxima fase começa
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

    // Após todas as fases, chama a API
    const lastDelay = ORCHESTRATION_DELAYS['team-formed'] + 800
    setTimeout(() => {
      setOrchestration((prev) => ({
        ...prev,
        completedPhases: [...ORCHESTRATION_SEQUENCE],
        phase: 'team-formed',
      }))
      callOrchestrate(submittedVision)
    }, lastDelay)
  }

  async function callOrchestrate(submittedVision: string) {
    setIsApiPending(true)
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: submittedVision }),
      })
      const data = await res.json()

      if (data.needsClarification && data.question) {
        setOrchestration((prev) => ({
          ...prev,
          phase: 'needs-clarification',
          question: data.question,
        }))
        setUiState('question')
      } else if (data.brief) {
        setOrchestration((prev) => ({
          ...prev,
          phase: 'team-formed',
          brief: data.brief,
        }))
        if (data.html) setGeneratedHtml(data.html)
        if (data.team) setSelectedTeam(data.team)
        if (data.projectId) setProjectId(data.projectId)
        setUiState('brief')
        setShowModal(true)
      }
    } catch {
      setOrchestration((prev) => ({
        ...prev,
        phase: 'needs-clarification',
        question: {
          id: 'q1',
          text: 'Para quem é esse projeto — uso pessoal ou outras pessoas vão acessar também?',
        },
      }))
      setUiState('question')
    } finally {
      setIsApiPending(false)
    }
  }

  async function handleAnswer(answer: string) {
    setUiState('orchestrating')
    setOrchestration((prev) => ({
      ...prev,
      phase: 'team-formed',
      question: undefined,
      completedPhases: [...ORCHESTRATION_SEQUENCE],
    }))

    // Chama novamente com a resposta
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: vision,
          clarification: answer,
          questionId: orchestration.question?.id,
        }),
      })
      const data = await res.json()

      if (data.brief) {
        setOrchestration((prev) => ({ ...prev, brief: data.brief }))
        setUiState('brief')
      }
    } catch {
      setOrchestration((prev) => ({
        ...prev,
        brief: {
          title: vision.slice(0, 60),
          description: 'Projeto gerado com base na sua visão.',
          personality: 'claro, direto, com propósito',
          visualDNA: ['minimalista', 'funcional', 'confiável'],
          audience: answer,
          coreProblem: vision,
        },
      }))
      setUiState('brief')
    }
  }

  function handleConfirm() {
    setShowModal(false)
    if (projectId) {
      router.push(`/project/${projectId}`)
    } else if (generatedHtml) {
      // Fallback: blob se não salvou no DB
      const blob = new Blob([generatedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      {/* Logo — canto superior esquerdo */}
      <div className="fixed top-6 left-6">
        <Logo size={72} />
      </div>

      {/* Ações — canto superior direito */}
      <div className="fixed top-6 right-6 flex items-center gap-3">
        <Link
          href="/projects"
          className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Projetos
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Modal do brief */}
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

          {/* IDLE — campo de entrada */}
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

                {/* Botão enviar */}
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

              {/* Ações secundárias */}
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

          {/* ORCHESTRATING + QUESTION — visão + status */}
          {(uiState === 'orchestrating' || uiState === 'question') && (
            <motion.div
              key="orchestrating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              {/* Bolha da visão */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4"
              >
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {vision}
                </p>
              </motion.div>

              {/* Orquestração */}
              <OrchestrationDisplay
                currentPhase={orchestration.phase}
                completedPhases={orchestration.completedPhases}
              />

              {/* Aguardando API após animação completar */}
              {isApiPending && orchestration.completedPhases.length === 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 pl-7"
                >
                  <motion.span
                    className="flex gap-1"
                    animate={{}}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block w-1 h-1 rounded-full bg-neutral-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </motion.span>
                  <span className="text-xs text-neutral-600">
                    O time está trabalhando...
                  </span>
                </motion.div>
              )}

              {/* Pergunta de condução */}
              {uiState === 'question' && orchestration.question && (
                <GuidingQuestion
                  question={orchestration.question}
                  onAnswer={handleAnswer}
                />
              )}
            </motion.div>
          )}

          {/* BRIEF — orquestração permanece visível com modal por cima */}
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
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
