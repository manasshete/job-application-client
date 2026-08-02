'use client'

export function MetricsMarquee() {
  const metrics = [
    { label: 'Job Seekers', value: '1000+' },
    { label: 'Avg Time Saved', value: '5 hours/week' },
    { label: 'Applications Tracked', value: '50K+' },
    { label: 'AI Documents Generated', value: '100K+' },
    { label: 'Interview Prep Time', value: '50% faster' },
  ]

  // Duplicate array for seamless loop
  const displayMetrics = [...metrics, ...metrics]

  return (
    <section className="w-full bg-card/30 border-t border-b border-border py-8 overflow-hidden">
      <div className="relative flex items-center h-20">
        {/* Fade edges for visual effect */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Marquee container */}
        <div className="flex gap-16 marquee">
          {displayMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center flex-shrink-0 whitespace-nowrap"
            >
              <p className="text-sm font-medium text-chart-1">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
