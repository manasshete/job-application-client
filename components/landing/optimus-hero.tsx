'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CharacterProps {
  char: string
  delay: number
}

function Character({ char, delay }: CharacterProps) {
  return (
    <span
      className="inline-block char-reveal"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  )
}

interface AnimatedWordProps {
  words: string[]
  className?: string
}

function AnimatedWord({ words, className = '' }: AnimatedWordProps) {
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2500) // 2.5s per word

    return () => clearInterval(timer)
  }, [words.length])

  const word = words[currentWord]
  let delayMs = 0

  return (
    <span className={className}>
      {word.split('').map((char, i) => {
        const delay = delayMs
        delayMs += 50
        return <Character key={`${currentWord}-${i}`} char={char} delay={delay} />
      })}
    </span>
  )
}

export function OptimosHero() {
  return (
    <section className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 py-20 lg:px-12 lg:py-32 overflow-hidden">
      {/* Background grid / pattern (subtle) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl text-center space-y-8 animate-fade-up">
        {/* Badge / eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm font-medium text-muted-foreground animate-fade-up"
          style={{ animationDelay: '0ms' }}>
          <span className="w-2 h-2 rounded-full bg-chart-1" />
          Apply faster, smarter, with confidence
        </div>

        {/* Main headline with animated word cycle */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none text-foreground animate-fade-up"
            style={{ animationDelay: '100ms' }}>
            Stop copying details.
            <br />
            Start
            {' '}
            <AnimatedWord
              words={['tracking', 'tailoring', 'winning']}
              className="text-chart-1"
            />
            .
          </h1>

          {/* Subheadline — secondary line muted */}
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto animate-fade-up"
            style={{ animationDelay: '200ms' }}>
            Your job search, organized in minutes. Tailored for every role. AI that doesn&apos;t fabricate.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 animate-fade-up"
          style={{ animationDelay: '300ms' }}>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2 text-base px-8 py-6 h-auto btn-press">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto btn-press">
            Watch Demo (2 min)
          </Button>
        </div>

        {/* Trust line with metrics */}
        <div className="flex items-center justify-center gap-6 pt-12 text-sm text-muted-foreground animate-fade-up"
          style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-2" />
            1000+ job seekers
          </div>
          <div className="hidden sm:flex w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-3" />
            5min average setup
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float opacity-50">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
