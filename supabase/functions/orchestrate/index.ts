import { createClient } from 'npm:@supabase/supabase-js'
import { orchestrate, ProgressEvent } from '../_shared/orchestrator.ts'
import { BrandOutput } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function sseEvent(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  let body: { content?: string; clarification?: string; questionId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { content, clarification, questionId } = body

  if (!content || typeof content !== 'string') {
    return new Response(JSON.stringify({ error: 'content é obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Extrai user_id do JWT (opcional — projetos anônimos são permitidos)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let userId: string | null = null
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.replace('Bearer ', '')
    const { data } = await supabase.auth.getUser(jwt)
    userId = data.user?.id ?? null
  }

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

        const { data: project } = await supabase
          .from('projects')
          .insert({
            vision: content.trim(),
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            user_id: userId,
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
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
})
