'use client'

/**
 * AnimateIn — lightweight scroll-reveal wrapper.
 *
 * Uses IntersectionObserver to add the `.is-visible` class when the element
 * enters the viewport, triggering the CSS transitions defined in globals.css
 * (.reveal, .reveal-scale). Zero JS animation, zero new dependencies.
 *
 * The `once` prop (default true) ensures the animation fires only once,
 * which is correct for most landing-page sections. Respects
 * `prefers-reduced-motion` via the CSS media query in globals.css.
 */

import React, { useEffect, useRef, type ReactNode, type ElementType } from 'react'
import { cn } from '@/lib/utils'

interface AnimateInProps {
  children: ReactNode
  className?: string
  /** CSS variant class: 'reveal' (fade+up) | 'reveal-scale' (scale+fade). Default: 'reveal' */
  variant?: 'reveal' | 'reveal-scale'
  /** Extra transition-delay class, e.g. 'reveal-delay-2'. Optional. */
  delay?: string
  /** Intersection threshold 0–1. Default: 0.12 */
  threshold?: number
  /** Fire animation only once. Default: true */
  once?: boolean
  /** HTML tag to render. Default: 'div' */
  as?: ElementType
}

export function AnimateIn({
  children,
  className,
  variant = 'reveal',
  delay,
  threshold = 0.12,
  once = true,
  as: Tag = 'div',
}: AnimateInProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          if (once) observer.disconnect()
        } else if (!once) {
          el.classList.remove('is-visible')
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={cn(variant, delay, className)}>
      {children}
    </Tag>
  )
}

/**
 * AnimateInGroup — wraps a stagger group. The parent itself doesn't animate;
 * each direct child should have reveal + reveal-delay-N classes.
 */
interface AnimateInGroupProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

export function AnimateInGroup({ children, className, as: Tag = 'div' }: AnimateInGroupProps) {
  return <Tag className={className}>{children}</Tag>
}
