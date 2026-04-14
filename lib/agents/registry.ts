import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AgentRecord {
  id: string
  name: string
  description: string
  emoji: string
  squad: string
  content: string
}

export interface SelectedAgent {
  id: string
  name: string
  emoji: string
  squad: string
  role: string          // papel que vai desempenhar neste projeto
  expertise: string     // trecho do content relevante para o contexto
}

// Busca agentes de squads específicos
export async function fetchAgentsBySquads(squads: string[]): Promise<AgentRecord[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, description, emoji, squad, content')
    .in('squad', squads)
    .eq('active', true)

  if (error) throw new Error(`Registry error: ${error.message}`)
  return (data ?? []) as AgentRecord[]
}

// Busca agentes específicos por ID
export async function fetchAgentsByIds(ids: string[]): Promise<AgentRecord[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, description, emoji, squad, content')
    .in('id', ids)
    .eq('active', true)

  if (error) throw new Error(`Registry error: ${error.message}`)
  return (data ?? []) as AgentRecord[]
}

// Extrai a seção mais relevante do content para usar como contexto
export function extractExpertise(content: string, maxChars = 800): string {
  // Pega a seção de missão / identidade / foco do agente
  const sections = [
    /## (?:Your )?(?:Core )?Mission[\s\S]*?(?=\n##|$)/i,
    /## (?:Your )?Identity[\s\S]*?(?=\n##|$)/i,
    /## Focus[\s\S]*?(?=\n##|$)/i,
    /> ACTIVATION-NOTICE:[\s\S]*?(?=\n\n|$)/i,
  ]

  for (const pattern of sections) {
    const match = content.match(pattern)
    if (match && match[0].length > 100) {
      return match[0].slice(0, maxChars).trim()
    }
  }

  // Fallback: primeiros 800 chars do content
  return content.slice(0, maxChars).trim()
}
