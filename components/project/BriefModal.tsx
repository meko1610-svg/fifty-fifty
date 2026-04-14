'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ProjectBrief } from '@/lib/types'

interface AgentSummary {
  name: string
  emoji: string
  role: string
}

interface BriefModalProps {
  brief: ProjectBrief
  html: string | null
  team?: Record<string, AgentSummary[]>
  onConfirm: () => void
}

export function BriefModal({ brief, html, team, onConfirm }: BriefModalProps) {
  const allAgents = team
    ? Object.values(team).flat()
    : []
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg px-4 pb-8"
      >
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">
              Entendemos o seguinte
            </p>
            <h2 className="text-xl font-medium text-neutral-100 leading-snug">
              {brief.title}
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Personalidade */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-neutral-500 uppercase tracking-widest">
                Personalidade
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {brief.personality}
              </p>
            </div>

            {/* DNA Visual */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-neutral-500 uppercase tracking-widest">
                DNA Visual
              </p>
              <div className="flex flex-wrap gap-2">
                {brief.visualDNA.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-neutral-400 border border-neutral-700 rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Para quem */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-neutral-500 uppercase tracking-widest">
                Para quem
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {brief.audience}
              </p>
            </div>

          </div>

          {/* Time convocado */}
          {allAgents.length > 0 && (
            <div className="px-6 pb-5 flex flex-col gap-2">
              <p className="text-xs text-neutral-500 uppercase tracking-widest">
                Time convocado
              </p>
              <div className="flex flex-wrap gap-2">
                {allAgents.map((agent, i) => (
                  <span
                    key={i}
                    title={agent.role}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 border border-neutral-800 rounded-full px-3 py-1"
                  >
                    <span>{agent.emoji}</span>
                    <span>{agent.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-6 pb-6">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onConfirm}
              className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-medium rounded-xl py-3.5 transition-colors text-sm"
            >
              Tudo pronto — vamos lá →
            </motion.button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}
