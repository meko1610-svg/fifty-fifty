import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export const metadata = {
  title: 'Fifty-Fifty — Você pensa. Nós construímos.',
  description: 'Descreva sua ideia. Um time de agentes de IA cria a identidade, o copy, o design e o código — em menos de 60 segundos.',
}

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#222] bg-[#0A0A0A]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size={60} />
          <Link
            href="/login"
            className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors"
          >
            Entrar →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-14 text-center border-b border-[#222]">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">

          <div className="inline-flex items-center gap-2 border border-[#333] rounded-full px-4 py-1.5 text-xs text-[#888] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#888] animate-pulse" />
            Beta aberto — grátis para usar
          </div>

          <h1
            className="font-light tracking-tight leading-[1.05] text-[#F5F5F5]"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)', letterSpacing: '-0.03em' }}
          >
            Você descreveu.<br />
            O time construiu.<br />
            <span className="text-[#888]">MVP Pronto.</span>
          </h1>

          <p className="text-[#888] text-lg leading-relaxed max-w-xl">
            Cole sua ideia em texto. Em menos de 60 segundos, um time de agentes de IA
            cria a identidade, o copy, o design e o código — tudo funcionando.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/new"
              className="bg-[#E8E8E8] text-[#0A0A0A] px-8 py-3.5 text-sm font-medium hover:bg-white transition-colors"
            >
              Criar meu site agora — é grátis
            </Link>
            <span className="text-xs text-[#444]">
              Sem cartão de crédito. Sem instalação. Funciona no navegador.
            </span>
          </div>
        </div>
      </section>

      {/* 50/50 */}
      <section className="border-b border-[#222] py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16 text-center">
            <p className="text-xs text-[#444] font-mono uppercase tracking-widest mb-3">O conceito</p>
            <h2
              className="font-light text-[#F5F5F5] tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em' }}
            >
              Fifty-Fifty.
            </h2>
            <p className="mt-4 text-[#555] text-base max-w-md mx-auto leading-relaxed">
              O nome não é à toa. A parceria é real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#222]">

            {/* Lado do usuário */}
            <div className="bg-[#0A0A0A] p-12 flex flex-col gap-8">
              <div className="flex items-baseline gap-4">
                <span
                  className="font-mono font-light text-[#222]"
                  style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', lineHeight: 1 }}
                >
                  50
                </span>
                <span className="text-xs text-[#444] font-mono uppercase tracking-widest">% você</span>
              </div>
              <div className="flex flex-col gap-5">
                <p className="text-sm text-[#888] leading-relaxed">
                  Você traz o que nenhuma IA tem: <span className="text-[#F5F5F5]">a ideia</span>.
                  O contexto do seu mercado, o problema que você quer resolver, quem é o seu cliente.
                </p>
                <ul className="flex flex-col gap-3">
                  {['A visão do produto', 'O problema que você resolve', 'Para quem é', 'O que você quer dizer ao mundo'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-[#555]">
                      <span className="w-px h-3 bg-[#333] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lado da plataforma */}
            <div className="bg-[#0D0D0D] p-12 flex flex-col gap-8">
              <div className="flex items-baseline gap-4">
                <span
                  className="font-mono font-light text-[#F5F5F5]"
                  style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', lineHeight: 1 }}
                >
                  50
                </span>
                <span className="text-xs text-[#666] font-mono uppercase tracking-widest">% nós</span>
              </div>
              <div className="flex flex-col gap-5">
                <p className="text-sm text-[#888] leading-relaxed">
                  Nós trazemos o que levaria semanas:
                  <span className="text-[#F5F5F5]"> a execução completa</span>.
                  Um time de agentes especializados que trabalham juntos, em paralelo, pela sua ideia.
                </p>
                <ul className="flex flex-col gap-3">
                  {['Identidade de marca única', 'Copy de conversão', 'Design system sob medida', 'Código HTML funcional', 'Revisão de segurança'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-[#666]">
                      <span className="w-px h-3 bg-[#F5F5F5]/20 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          <p className="mt-8 text-center text-xs text-[#333] font-mono">
            Você + nós = site pronto em 60 segundos.
          </p>

        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-[#111] border-b border-[#222] py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16">
            <p className="text-xs text-[#444] font-mono uppercase tracking-widest mb-3">Como funciona</p>
            <h2
              className="font-light text-[#F5F5F5] tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em' }}
            >
              Três passos.<br />Menos de um minuto.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#222]">
            {[
              {
                n: '01',
                title: 'Descreva sua ideia',
                body: 'Escreva como você descreveria para um amigo. "Quero um site para consultoria financeira para autônomos." É suficiente.',
              },
              {
                n: '02',
                title: 'O time entra em ação',
                body: 'Cinco agentes trabalham em paralelo: identidade, copy, design system, código e segurança. Cada um especializado no que faz.',
              },
              {
                n: '03',
                title: 'Seu site está pronto',
                body: 'Acesse pelo link permanente, baixe o HTML ou compartilhe direto. É seu — completo, funcional, bonito.',
              },
            ].map((step) => (
              <div key={step.n} className="bg-[#111] p-10 flex flex-col gap-6">
                <span className="font-mono text-5xl font-light text-[#2A2A2A]">{step.n}</span>
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-medium text-[#F5F5F5]">{step.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-32 px-6 border-b border-[#222]">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16">
            <p className="text-xs text-[#444] font-mono uppercase tracking-widest mb-3">Por que Fifty-Fifty</p>
            <h2
              className="font-light text-[#F5F5F5] tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em' }}
            >
              Não é template.<br />É um time de IA.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Identidade única',
                body: 'Nada de templates copiados. Cada site tem personalidade, paleta e tipografia pensadas para o seu projeto.',
              },
              {
                title: 'Copy que vende',
                body: 'Headline, subheadline, CTA e proposta de valor escritos por um agente especializado em conversão.',
              },
              {
                title: 'Código limpo',
                body: 'HTML standalone que funciona em qualquer lugar, sem dependências, sem frameworks obrigatórios.',
              },
              {
                title: '60 segundos, não 60 dias',
                body: 'Da ideia ao site publicado. Sem reuniões, sem briefings, sem aprovações intermináveis.',
              },
              {
                title: 'Segurança revisada',
                body: 'Um agente de segurança valida o código antes de entregar. Sem vulnerabilidades, sem scripts suspeitos.',
              },
              {
                title: 'Histórico completo',
                body: 'Todos os seus projetos salvos, acessíveis. Gere novas versões quando quiser.',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="flex flex-col gap-3 py-6 border-t border-[#222]">
                <h3 className="text-sm font-medium text-[#F5F5F5]">{benefit.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="bg-[#111] border-b border-[#222] py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs text-[#444] font-mono uppercase tracking-widest mb-3">O que dizem</p>
              <h2
                className="font-light text-[#F5F5F5] tracking-tight"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em' }}
              >
                Resultados reais.
              </h2>
            </div>
            <p className="font-mono text-5xl font-light text-[#333]">+340</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#222]">
            {[
              {
                quote: 'Descrevi meu produto em duas frases e o site que saiu era melhor do que o que paguei R$&nbsp;4.000 para uma agência fazer.',
                name: 'Rafael M.',
                role: 'Fundador de SaaS B2B',
              },
              {
                quote: 'Usei para criar landing pages de teste antes de validar cada produto. O que levava uma semana agora leva um minuto.',
                name: 'Camila R.',
                role: 'Growth freelancer',
              },
              {
                quote: 'Mostrei para o meu cliente o primeiro rascunho em tempo real. Ele ficou impressionado que eu "trabalhei tão rápido".',
                name: 'Bruno T.',
                role: 'Consultor de marketing',
              },
            ].map((t) => (
              <div key={t.name} className="bg-[#111] p-10 flex flex-col justify-between gap-8">
                <p
                  className="text-sm text-[#888] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: `"${t.quote}"` }}
                />
                <div>
                  <p className="text-sm text-[#F5F5F5] font-medium">{t.name}</p>
                  <p className="text-xs text-[#444]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 px-6 border-b border-[#333] bg-[#111]">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
          <h2
            className="font-light text-[#F5F5F5] tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', letterSpacing: '-0.03em' }}
          >
            Sua próxima ideia<br />merece um site hoje.
          </h2>
          <p className="text-[#666] leading-relaxed">
            Não amanhã. Não depois que você contratar alguém. Agora.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/new"
              className="bg-[#E8E8E8] text-[#0A0A0A] px-8 py-3.5 text-sm font-medium hover:bg-white transition-colors"
            >
              Criar meu primeiro site →
            </Link>
            <span className="text-xs text-[#444]">Grátis durante o beta. Sem cartão de crédito.</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={48} />
          <p className="text-xs text-[#333]">
            © {new Date().getFullYear()} Fifty-Fifty. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
