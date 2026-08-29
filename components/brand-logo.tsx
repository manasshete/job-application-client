import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  markClassName?: string
  wordmarkClassName?: string
  compact?: boolean
}

/** Canonical Pursuitz brand mark and wordmark. */
export function BrandLogo({
  className,
  markClassName,
  wordmarkClassName,
  compact = false,
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-primary',
          markClassName,
        )}
      >
        <span className="h-[9px] w-[9px] rotate-45 rounded-[1px] bg-primary-foreground" />
      </span>
      {!compact && (
        <span className={cn('text-[17px] font-semibold tracking-tight', wordmarkClassName)}>
          Pursuitz
        </span>
      )}
    </span>
  )
}
