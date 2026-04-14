'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/new'
  const hasError = searchParams.get('error') === 'auth'

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('loading')
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="text-4xl">✉️</div>
        <h2 className="text-lg font-light text-neutral-100">Verifique seu e-mail</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Enviamos um link de acesso para <span className="text-neutral-300">{email}</span>.
          <br />Clique no link para entrar.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Usar outro e-mail
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-light text-neutral-100 tracking-tight mb-1">
          Entrar
        </h1>
        <p className="text-sm text-neutral-500">
          Você vai receber um link de acesso por e-mail.
        </p>
      </div>

      {hasError && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
          Link inválido ou expirado. Tente novamente.
        </p>
      )}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com"
        required
        autoFocus
        className="bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder:text-neutral-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 transition-colors"
      />

      <button
        type="submit"
        disabled={!email.trim() || status === 'loading'}
        className="bg-neutral-100 hover:bg-white text-neutral-900 rounded-2xl py-3 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Enviando...' : 'Enviar link de acesso'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="fixed top-6 left-6">
        <Logo size={72} />
      </div>

      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
