'use client'

import Link from 'next/link'
import { ArrowRight, Check, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OptimosHero } from '@/components/landing/optimus-hero'
import { MetricsMarquee } from '@/components/landing/metrics-marquee'

export default function LandingPageOptimus() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with animated word cycles */}
      <OptimosHero />

      {/* Metrics marquee ticker */}
      <MetricsMarquee />

      {/* How It Works — 3-step interactive demo */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16 animate-fade-up">
            <p className="text-sm font-medium text-chart-1">HOW IT WORKS</p>
            <h2 className="text-5xl lg:text-6xl font-bold text-foreground">
              From job posting to <br /> tailored application in 5 minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No spreadsheets. No rewrites. Just smart automation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Paste & Extract',
                description: 'Paste any job URL. AI instantly pulls the role, company, salary, and requirements into your Kanban board.',
                icon: '📋',
              },
              {
                step: '02',
                title: 'Tailor & Generate',
                description: 'Your master resume and cover letter are automatically tailored to match this specific role. ATS-optimized.',
                icon: '✨',
              },
              {
                step: '03',
                title: 'Download & Apply',
                description: 'Export as PDF or TXT. Track every status update. Apply with confidence knowing your materials are perfect.',
                icon: '🚀',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative p-8 rounded-lg border border-border bg-card/30 hover:bg-card/50 hover:border-chart-1/50 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${parseInt(item.step) * 100}ms` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-chart-1/5 to-chart-2/5 rounded-lg pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl font-bold text-chart-1/20 group-hover:text-chart-1/40 transition-colors">
                      {item.step}
                    </span>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3 feature-heading">
                    {item.title}
                  </h3>
                  <p className="text-foreground/60 leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features section with icons */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-card/20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <p className="text-sm font-medium text-chart-1">FEATURES</p>
            <h2 className="text-5xl lg:text-6xl font-bold text-foreground">
              Everything you need to win
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'AI Extraction',
                description: 'Paste any job URL. Pull role details, salary, requirements — instantly.',
                items: ['Works with LinkedIn', 'Indeed & company pages', 'Auto-fills your Kanban board'],
              },
              {
                title: 'AI Resume Tailoring',
                description: 'Your master CV tailored for every role without fabricating experience.',
                items: ['2 free / month', 'ATS-optimized', 'Evidence-based rewriting'],
              },
              {
                title: 'AI Cover Letters',
                description: 'Personalized cover letters in seconds. Map your evidence to the job requirements.',
                items: ['2 free / month', 'Evidence-backed', 'Download as PDF or TXT'],
              },
              {
                title: 'Application Tracking',
                description: 'Kanban board and timeline view. Never lose track of a role again.',
                items: ['Visual status updates', 'Interview scheduling', 'Notes & documents'],
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-lg border border-border bg-background hover:bg-card/50 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-foreground/60 mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/70">
                      <Check className="w-5 h-5 text-chart-1 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / testimonials */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div>
            <p className="text-sm font-medium text-chart-1 mb-4">TESTIMONIALS</p>
            <h2 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Job seekers are using Pursuitz to land offers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Went from 0 offers to 3 in-progress interviews in 2 weeks. The resume tailoring is ridiculous.',
                author: 'Sarah K.',
                title: 'Software Engineer',
              },
              {
                quote: 'I used to spend 30 minutes per application. Now it&apos;s 5 minutes. Total game changer.',
                author: 'Marcus T.',
                title: 'Product Manager',
              },
              {
                quote: 'Finally organized. This is what I wish existed when I was job hunting last year.',
                author: 'Alex P.',
                title: 'Data Analyst',
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card/30">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-chart-4 text-chart-4"
                    />
                  ))}
                </div>
                <p className="text-foreground/70 mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <p className="text-sm font-medium text-chart-1">PRICING</p>
            <h2 className="text-5xl lg:text-6xl font-bold">
              Pick your plan
            </h2>
            <p className="text-lg text-background/70 max-w-2xl mx-auto">
              Free to start. Upgrade when you need unlimited power.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '₹0',
                features: ['10 applications', '5 AI extractions', '2 AI documents/month', 'Basic tracking'],
              },
              {
                name: 'Pro',
                price: '₹299',
                features: ['Unlimited applications', '100 AI extractions/month', '100 AI documents/month', 'Advanced analytics', 'PDF exports'],
                highlight: true,
              },
              {
                name: 'Premium',
                price: '₹499',
                features: ['Everything in Pro', '300 AI documents/month', 'Priority support', 'Custom integrations'],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-lg border transition-all duration-300 ${
                  plan.highlight
                    ? 'border-chart-1 bg-chart-1/10 scale-105 shadow-lg'
                    : 'border-background/30 bg-background/10 hover:border-chart-1/50'
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-background/70 ml-2">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-background/80">
                      <Check className="w-5 h-5 text-chart-1 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className={`w-full ${plan.highlight ? 'bg-chart-1 text-background hover:bg-chart-1/90' : ''}`}
                  variant={plan.highlight ? 'default' : 'outline'}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-5xl lg:text-6xl font-bold text-foreground">
            Ready to transform your job search?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join 1000+ job seekers who are landing more interviews, faster.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2 text-base px-8 py-6 h-auto">
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
