import Anthropic from 'npm:@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})
