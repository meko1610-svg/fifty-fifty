import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, vision, brief, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-12">
      <div className="fixed top-6 left-6">
        <Link href="/new">
          <Logo size={72} />
        </Link>
      </div>

      <div className="max-w-xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-light text-neutral-100">Seus projetos</h1>
          <Link
            href="/new"
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-900 font-medium transition-colors"
          >
            + Novo
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-600 text-sm">Nenhum projeto ainda.</p>
            <Link
              href="/new"
              className="mt-4 inline-block text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Criar primeiro projeto →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => {
              const brief = project.brief as { title?: string } | null
              const date = new Date(project.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })

              return (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-5 py-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 font-medium truncate group-hover:text-white transition-colors">
                        {brief?.title ?? 'Projeto sem título'}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed line-clamp-2">
                        {project.vision}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-700 shrink-0 pt-0.5">{date}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
