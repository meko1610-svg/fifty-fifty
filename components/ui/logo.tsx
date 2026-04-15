interface LogoProps {
  size?: number
}

export function Logo({ size = 120 }: LogoProps) {
  const fontSize = Math.round(size * 0.22)

  return (
    <span
      className="font-mono font-light tracking-widest text-neutral-100 select-none uppercase"
      style={{ fontSize, letterSpacing: '0.18em' }}
    >
      Fifty-Fifty
    </span>
  )
}
