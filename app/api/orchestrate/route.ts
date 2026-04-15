import { NextRequest } from 'next/server'
import { orchestrate, ProgressEvent } from '@/lib/orchestrator'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { BrandOutput } from '@/lib/types'

function sseEvent(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { content, clarification, questionId } = body

  if (!content || typeof content !== 'string') {
    return Response.json({ error: 'content é obrigatório' }, { status: 400 })
  }

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(sseEvent(data))

      try {
        const result = await orchestrate(
          { vision: content.trim(), clarification: clarification?.trim(), questionId },
          (event: ProgressEvent) => send({ type: event.type })
        )

        if (result.needsClarification) {
          send({ type: 'clarification', question: result.question })
          controller.close()
          return
        }

        const { brand, copy, design, html } = result.result!

        // Salva no Supabase
        const supabase = createAdminClient()
        const { data: project } = await supabase
          .from('projects')
          .insert({
            vision: content.trim(),
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            user_id: user?.id ?? null,
            brief: {
              title: (brand as BrandOutput).projectName,
              description: copy.valueProposition,
              personality: brand.tone,
              visualDNA: brand.personality,
              audience: brand.audience,
              coreProblem: brand.coreProblem,
            },
            html,
            team: result.team,
            brand,
            copy,
            design,
          })
          .select('id')
          .single()

        send({
          type: 'done',
          projectId: project?.id ?? null,
          brief: {
            title: (brand as BrandOutput).projectName,
            description: copy.valueProposition,
            personality: brand.tone,
            visualDNA: brand.personality,
            audience: brand.audience,
            coreProblem: brand.coreProblem,
          },
          team: result.team,
          html,
        })
      } catch (err) {
        console.error('Orchestrate stream error:', err)
        send({ type: 'error', message: 'Erro interno na orquestração' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
