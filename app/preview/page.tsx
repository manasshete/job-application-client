'use client'

import { OptimosHero } from '@/components/landing/optimus-hero'
import { MetricsMarquee } from '@/components/landing/metrics-marquee'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, Star, Zap, Target, FileText, Mail, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border nav-float">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">Pursuitz</div>
          <div className="flex gap-6 items-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Current Page
            </Link>
            <Button className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32">
        <OptimosHero />
      </div>

      {/* Metrics Marquee */}
      <div className="py-16 border-y border-border">
        <MetricsMarquee />
      </div>

      {/* How It Works */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">How Pursuitz Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Three simple steps to take control of your job search. From tracking to tailoring to winning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: 1,
                title: 'Add Jobs & Parse Details',
                desc: 'Paste a job description. Our AI instantly extracts requirements, salary, skills, and key details.',
                icon: Zap,
              },
              {
                num: 2,
                title: 'Generate Tailored Materials',
                desc: 'Get a resume and cover letter tailored to each role. Evidence-based, never fabricated.',
                icon: FileText,
              },
              {
                num: 3,
                title: 'Track & Analyze',
                desc: 'Track applications, interviews, and offers. Measure progress with visual analytics.',
                icon: BarChart3,
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group p-8 rounded-lg border border-border bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {step.num}
                  </div>
                  <step.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold mb-3 feature-heading">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">Built for Job Seekers</h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Everything you need to track, tailor, and win job opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                icon: Zap,
                title: 'AI Job Parsing',
                benefits: ['Extract requirements instantly', 'Identify key skills', 'Auto-categorize roles'],
              },
              {
                icon: FileText,
                title: 'Resume Tailoring',
                benefits: ['Evidence-based rewrites', 'Zero fabrication', 'Keyword-optimized'],
              },
              {
                icon: Mail,
                title: 'Cover Letter Generation',
                benefits: ['Personalized in seconds', 'Compelling narratives', 'PDF ready'],
              },
              {
                icon: BarChart3,
                title: 'Application Tracking',
                benefits: ['Visual pipeline', 'Interview scheduling', 'Offer management'],
              },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-lg border border-border hover:border-primary/50 transition-all">
                <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-125 transition-transform" />
                <h3 className="text-xl font-semibold mb-4 feature-heading">{feature.title}</h3>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, j) => (
                    <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">Trusted by Job Seekers</h2>
            <p className="text-lg text-muted-foreground">Join thousands who've landed their dream roles.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Pursuitz saved me hours on every application. The tailored resume got me 3x more interviews.',
                author: 'Sarah Chen',
                role: 'Product Manager',
                rating: 5,
              },
              {
                quote: 'Finally, a tool that tracks everything without the chaos. Landed my offer in 2 months.',
                author: 'Marcus Johnson',
                role: 'Software Engineer',
                rating: 5,
              },
              {
                quote: 'The AI cover letters feel genuinely personal. No more generic templates.',
                author: 'Alex Rodriguez',
                role: 'UX Designer',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-lg border border-border bg-slate-900/40">
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-slate-950 border-t border-border">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Start free. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '$0',
                desc: 'Perfect for getting started',
                features: [
                  'Up to 10 job applications',
                  '5 AI extractions/month',
                  '2 AI documents/month',
                  'Basic application tracking',
                ],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Pro',
                price: '$299',
                desc: 'For serious job seekers',
                features: [
                  'Unlimited applications',
                  'Unlimited AI extractions',
                  'Unlimited AI documents',
                  'Advanced analytics',
                  'PDF downloads',
                  'Priority support',
                ],
                cta: 'Start Pro',
                highlighted: true,
              },
              {
                name: 'Premium',
                price: '$499',
                desc: 'For power users',
                features: [
                  'Everything in Pro',
                  'Early access to features',
                  'Personal interview prep',
                  'Email support',
                  'Export to CSV',
                ],
                cta: 'Start Premium',
                highlighted: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-lg border p-8 transition-all ${
                  plan.highlighted
                    ? 'border-primary bg-primary/5 ring-1 ring-primary scale-105'
                    : 'border-border bg-slate-900/40'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Button className="w-full mb-8" variant={plan.highlighted ? 'default' : 'outline'}>
                  {plan.cta}
                </Button>
                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">Ready to Take Control?</h2>
            <p className="text-xl text-muted-foreground">
              Start tracking, tailoring, and winning today. Free forever, upgrade anytime.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>© 2024 Pursuitz. All rights reserved.</p>
      </footer>
    </div>
  )
}
