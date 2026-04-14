'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { GuidingQuestion as GuidingQuestionType } from '@/lib/types'

interface GuidingQuestionProps {
  question: GuidingQuestionType
  onAnswer: (answer: string) => void
}

export function GuidingQuestion({ question, onAnswer }: GuidingQuestionProps) {
  const [answer, setAnswer] = useState('')

  function handleSubmit() {
    if (!answer.trim()) return
    onAnswer(answer.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col gap-4 mt-6"
    >
      <p className="text-sm text-neutral-400">
        Antes de começar, quero entender melhor uma coisa:
      </p>

      <div className="border border-neutral-700 rounded-xl p-4 bg-neutral-900/50">
        <p className="text-neutral-100 text-base leading-relaxed">
          {question.text}
        </p>
      </div>

      <div className="relative">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva aqui..."
          className="resize-none bg-neutral-900 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 rounded-xl pr-12 min-h-[80px]"
          autoFocus
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="absolute bottom-3 right-3 h-7 w-7 rounded-lg bg-neutral-100 hover:bg-white text-neutral-900 disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </motion.div>
  )
}
