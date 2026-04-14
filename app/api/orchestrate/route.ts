import { NextRequest, NextResponse } from 'next/server'
import { orchestrate } from '@/lib/orchestrator'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, clarification, questionId } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content é obrigatório' }, { status: 400 })
    }

    const result = await orchestrate({
      vision: content.trim(),
      clarification: clarification?.trim(),
      questionId,
    })

    if (result.needsClarification) {
      return NextResponse.json({
        needsClarification: true,
        question: result.question,
      })
    }

    const { brand, copy, design, html } = result.result!

    // Salva o projeto no Supabase
    const supabase = createAdminClient()
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        vision: content.trim(),
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        brief: {
          title: brand.projectName,
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

    if (error) {
      console.error('Erro ao salvar projeto:', error)
    }

    return NextResponse.json({
      needsClarification: false,
      projectId: project?.id ?? null,
      brief: {
        title: brand.projectName,
        description: copy.valueProposition,
        personality: brand.tone,
        visualDNA: brand.personality,
        audience: brand.audience,
        coreProblem: brand.coreProblem,
      },
      team: result.team,
      html,
      brand,
      copy,
      design,
    })
  } catch (error) {
    console.error('Orchestrate error:', error)
    return NextResponse.json(
      { error: 'Erro interno na orquestração' },
      { status: 500 }
    )
  }
}
