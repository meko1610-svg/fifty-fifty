import Image from 'next/image'

interface LogoProps {
  size?: number
}

export function Logo({ size = 120 }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Fifty-Fifty"
      width={size}
      height={size}
      priority
    />
  )
}
