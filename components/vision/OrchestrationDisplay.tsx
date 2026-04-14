'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  OrchestrationPhase,
  ORCHESTRATION_MESSAGES,
  ORCHESTRATION_SEQUENCE,
} from '@/lib/types'

interface OrchestrationDisplayProps {
  currentPhase: OrchestrationPhase
  completedPhases: OrchestrationPhase[]
}

export function OrchestrationDisplay({
  currentPhase,
  completedPhases,
}: OrchestrationDisplayProps) {
  const visiblePhases = ORCHESTRATION_SEQUENCE.filter(
    (phase) =>
      completedPhases.includes(phase) || phase === currentPhase
  )

  return (
    <div className="flex flex-col gap-3 py-2">
      <AnimatePresence mode="popLayout">
        {visiblePhases.map((phase) => {
          const isDone = completedPhases.includes(phase)
          const isActive = phase === currentPhase && !isDone

          return (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center gap-3"
            >
              {/* Indicador */}
              <span className="w-4 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="text-neutral-400 text-sm"
                  >
                    ✓
                  </motion.span>
                ) : isActive ? (
                  <PulsingDot />
                ) : null}
              </span>

              {/* Mensagem */}
              <span
                className={`text-sm transition-colors duration-300 ${
                  isDone
                    ? 'text-neutral-500'
                    : isActive
                    ? 'text-neutral-100'
                    : 'text-neutral-600'
                }`}
              >
                {ORCHESTRATION_MESSAGES[phase]}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function PulsingDot() {
  return (
    <motion.span
      className="block w-1.5 h-1.5 rounded-full bg-neutral-300"
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
