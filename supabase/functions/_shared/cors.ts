/**
 * CORS com allowlist explícita.
 *
 * Em desenvolvimento: localhost:3000 é sempre permitido.
 * Em produção: definir a variável de ambiente ALLOWED_ORIGIN via
 *   supabase secrets set ALLOWED_ORIGIN=https://seu-dominio.com --project-ref <ref>
 *
 * O header Vary: Origin instrui CDNs a não reutilizar respostas entre origens.
 */

const ALLOWED_ORIGINS: string[] = [
  'http://localhost:3000',
  Deno.env.get('ALLOWED_ORIGIN'),
].filter((o): o is string => typeof o === 'string' && o.length > 0)

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  // Ecoa a origem se estiver na allowlist; caso contrário usa a primeira entrada.
  // O navegador rejeitará o preflight automaticamente se houver divergência.
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}
