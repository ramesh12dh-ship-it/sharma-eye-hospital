import Image from 'next/image'
import { cn } from '@/lib/utils'

type Props = {
  size?: number
  className?: string
  /** Glow halo behind the mark (used on hero/login). */
  halo?: boolean
}

/** SARAS spiral mark — the architectural anchor of the brand. */
export function Logo({ size = 32, className, halo = false }: Props) {
  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {halo && (
        <span
          aria-hidden
          className="absolute inset-[-30%] rounded-full blur-2xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, var(--color-brand-300) 0%, transparent 65%)',
          }}
        />
      )}
      <Image
        src="/logo.png"
        alt="Sharma Eye Hospital"
        width={size}
        height={size}
        priority
        className="relative drop-shadow-[0_1px_2px_rgba(74,107,184,0.18)]"
      />
    </span>
  )
}
