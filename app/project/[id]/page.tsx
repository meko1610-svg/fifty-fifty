import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ProjectView } from '@/components/project/ProjectView'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, vision, brief, html, team, brand, copy, design, created_at, delivered_at')
    .eq('id', id)
    .single()

  if (error || !project || !project.html) {
    notFound()
  }

  return <ProjectView project={project} />
}
