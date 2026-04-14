'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  vision: string
  brief: {
    title: string
    description: string
    personality: string
    visualDNA: string[]
    audience: string
    coreProblem: string
  } | null
  html: string
  team: Record<string, { name: string; emoji: string; role: string }[]> | null
  created_at: string
}

interface Props {
  project: Project
}

export function ProjectView({ project }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const allAgents = project.team
    ? Object.values(project.team).flat()
    : []

  function handleDownload() {
    const blob = new Blob([project.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.brief?.title ?? 'projeto'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950">

      {/* Topbar */}
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-950">
        <div className="flex items-center gap-3">
          <Link href="/new" className="opacity-60 hover:opacity-100 transition-opacity">
            <Logo size={28} />
          </Link>
          <span className="text-neutral-600 text-xs">/</span>
          <span className="text-neutral-300 text-sm font-medium truncate max-w-xs">
            {project.brief?.title ?? 'Projeto'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            Projetos
          </Link>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            {sidebarOpen ? 'Fechar brief' : 'Ver brief'}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-900 font-medium transition-colors"
          >
            ↓ Download HTML
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-600 hover:text-neutral-400 hover:border-neutral-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex overflow-hidden">

        {/* iframe com o projeto gerado */}
        <div className="flex-1 relative">
          <iframe
            srcDoc={project.html}
            className="w-full h-full border-0"
            title={project.brief?.title ?? 'Projeto'}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Sidebar do brief */}
        {sidebarOpen && project.brief && (
          <aside className="w-80 flex-shrink-0 border-l border-neutral-800 bg-neutral-950 overflow-y-auto">
            <div className="p-5 flex flex-col gap-6">

              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Visão original</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{project.vision}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Personalidade</p>
                <p className="text-xs text-neutral-300 leading-relaxed">{project.brief.personality}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">DNA Visual</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.brief.visualDNA.map(tag => (
                    <span key={tag} className="text-[10px] text-neutral-400 border border-neutral-800 rounded-full px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Para quem</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{project.brief.audience}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Problema resolvido</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{project.brief.coreProblem}</p>
              </div>

              {allAgents.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">Time que trabalhou</p>
                  <div className="flex flex-col gap-1.5">
                    {allAgents.map((agent, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{agent.emoji}</span>
                        <span>{agent.name}</span>
                        <span className="text-neutral-700">·</span>
                        <span className="text-neutral-600 truncate">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800">
                <Link
                  href="/new"
                  className="block text-center text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-2"
                >
                  + Novo projeto
                </Link>
              </div>

            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
