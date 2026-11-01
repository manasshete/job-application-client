import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'
import { FREE_TOOLS } from '@/lib/tools'
import { PLANS } from '@/lib/pz/plans'
import { Link2, Plus } from 'lucide-react'
import { Brand } from '@/components/pz/brand'

const FAQS = [
  { q: 'Will Pursuitz make things up on my CV?', a: 'Tailoring rewords and reorders what is already on your master CV. Changes to dates, job titles, qualifications and skills are flagged, and you approve the result before you can download it. AI can still make mistakes, so always proofread.' },
  { q: 'What happens to my data?', a: 'Your data is encrypted and stored securely. We never sell your personal information. It is only shared with the services needed to run Pursuitz, for example AI processing of your CV and job posts, and payments. You can export your applications as a CSV and delete your account in Settings.' },
  { q: 'What are tokens?', a: 'AI features use tokens. Reading a job link uses one extraction. A tailored CV or a cover letter uses one document. Tokens come in batches that expire 60 days after they are added, and the oldest are used first. You can always see your balance and next expiry date.' },
  { q: 'Can I change or leave my plan?', a: 'Upgrading goes to Razorpay checkout. Downgrading takes effect straight away, after you confirm. Accounts with payment history are closed by support at info@pursuitz.co.' },
  { q: 'Will this get me a job?', a: 'No. Pursuitz is a personal organisation tool. It does not guarantee employment, interviews or offers.' },
]

// Sample data for the screenshot only.
const SHOT = {
  title: '3 things need you this week',
  summary: [{ v: '6', l: 'Active applications' }, { v: '2', l: 'Interviews this week' }, { v: '64%', l: 'Response rate' }],
  groups: [
    { label: 'Today', items: [{ gut: '3:00 PM', title: 'Round 2, System design', sub: 'Northwind, Frontend Engineer II', kind: 'Interview' }] },
    { label: 'This week', items: [
      { gut: 'Fri 11:00 AM', title: 'Portfolio review', sub: 'Beacon Labs, Senior Frontend Engineer', kind: 'Interview' },
      { gut: 'Due Sat', title: 'Submit take-home exercise', sub: 'Beacon Labs, Senior Frontend Engineer. In progress', kind: 'Task' },
    ] },
  ],
}

const NAV = ['Next steps', 'Applications', 'Documents', 'Analytics', 'Settings']

function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteConfig.url}/#software`,
        name: siteConfig.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteConfig.url,
        description: siteConfig.description,
        offers: PLANS.map((p) => ({ '@type': 'Offer', name: p.name, price: p.price.replace('₹', ''), priceCurrency: 'INR' })),
      },
      { '@type': 'WebSite', '@id': `${siteConfig.url}/#website`, url: siteConfig.url, name: siteConfig.name, description: siteConfig.description },
      {
        '@type': 'FAQPage',
        '@id': `${siteConfig.url}/#faq`,
        mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

export default function LandingPage() {
  return (
    <div className="lp">
      <StructuredData />

      <section className="lp-hero">
        <div className="lp-wrap">
          <h1>Keep track of where you applied,<br className="lp-br" /> and what to do next.</h1>
          <div className="lp-hero-foot">
            <p className="lp-lead">Pursuitz keeps every application, interview round, task and deadline in one place, and tells you what needs doing today.</p>
            <div className="lp-hero-act">
              <Link href="/auth/sign-up" className="btn btn-p">Create a free account</Link>
              <p className="lp-terms">Free for up to 10 applications.</p>
              <Link href="/auth/login" className="btn btn-t">Log in</Link>
            </div>
          </div>
          <figure className="lp-fig">
            <div className="lp-shot" data-slot="next-steps" data-kind="product" data-alt="The Next steps screen with sample applications" role="img" aria-label="Screenshot of the Pursuitz Next steps screen">
              <div className="lp-next">
                <div className="lp-next-side">
                  <span className="lp-next-brand"><Brand small /></span>
                  <div className="lp-next-nav">
                    {NAV.map((n, i) => (<span key={n} className={i ? undefined : 'is-on'}>{n}</span>))}
                  </div>
                </div>
                <div className="lp-next-main">
                  <div className="lp-next-head">
                    <h2>{SHOT.title}</h2>
                    <div className="lp-next-stats">
                      {SHOT.summary.map((m) => (
                        <div key={m.l}><div className="lp-next-fig">{m.v}</div><div className="lp-next-cap">{m.l}</div></div>
                      ))}
                    </div>
                  </div>
                  {SHOT.groups.map((g) => (
                    <div key={g.label} className="lp-next-grp">
                      <div className="lp-next-lbl">{g.label}</div>
                      {g.items.map((it) => (
                        <div key={it.title} className="lp-next-row">
                          <span className="lp-next-when">{it.gut}</span>
                          <span className="lp-next-what"><span className="lp-next-t">{it.title}</span><span className="lp-next-s">{it.sub}</span></span>
                          <span className="lp-next-kind">{it.kind}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <figcaption>The Next steps screen. Company names and dates are sample data.</figcaption>
          </figure>
        </div>
      </section>

      <section className="lp-sec lp-sec-l">
        <div className="lp-wrap lp-split lp-5-7">
          <div className="lp-text">
            <h2>Track</h2>
            <p>Paste a job link and Pursuitz reads the posting. You check the details, then save. Applications sit in one table, and each job has its own page for interview rounds, tasks, notes and documents.</p>
          </div>
          <figure className="lp-fig lp-proof">
            <div className="lp-shot lp-pad" data-slot="track" data-kind="product" data-alt="Adding a job from a link, then the applications table" role="img" aria-label="A job link read into company and job title fields, above the applications table">
              <div className="lp-link"><Link2 aria-hidden="true" /><span className="lp-url-t">https://company.com/careers/job-id</span><span className="btn btn-p lp-mini">Analyze job</span></div>
              <dl className="lp-fields">
                <div><dt>Company</dt><dd>Northwind</dd></div>
                <div><dt>Job title</dt><dd>Frontend Engineer II</dd></div>
              </dl>
              <div className="lp-table">
                <div className="lp-table-h"><span>Company</span><span>Job title</span><span>Status</span></div>
                <div className="lp-table-r"><span>Northwind</span><span>Frontend Engineer II</span><span className="st-interview">Interview</span></div>
                <div className="lp-table-r"><span>Beacon Labs</span><span>Senior Frontend Engineer</span><span className="st-interview">Interview</span></div>
              </div>
            </div>
            <figcaption>Company names are sample data.</figcaption>
          </figure>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap lp-split lp-4-8">
          <div className="lp-text">
            <h2>Prepare</h2>
            <p className="lp-sub">AI with your approval</p>
            <p>Tailor your CV or write a cover letter for one job. Changes appear as a redline, anything touching dates, job titles, qualifications or skills is flagged for you to keep or revert, and nothing downloads until you approve it.</p>
          </div>
          <figure className="lp-fig lp-proof">
            <div className="lp-shot lp-pad" data-slot="prepare" data-kind="product" data-alt="A tailored CV as a redline with one flagged change" role="img" aria-label="A tailored CV shown as a redline, with a job title change flagged to keep or revert">
              <p className="lp-doc-name">Tailored CV, Northwind</p>
              <div className="cvl lp-doc">
                <p className="cv-role"><span className="del">Frontend Engineer</span> <span className="ins">Senior Frontend Engineer</span><span className="mk">1</span></p>
                <p className="cv-p"><span className="del">Worked on</span> <span className="ins">Rebuilt</span> the checkout flow in React and <span className="del">helped with</span> <span className="ins">led</span> the move to a shared design system.</p>
              </div>
              <div className="lp-flag">
                <span className="mk">1</span>
                <span className="lp-flag-t"><span className="lp-next-t">Job title</span><span className="lp-next-s">Frontend Engineer changed to Senior Frontend Engineer</span></span>
                <span className="lp-flag-a"><span className="btn btn-q lp-mini">Keep</span><span className="btn btn-q lp-mini">Revert</span></span>
              </div>
              <div className="lp-approve">
                <span className="lp-next-s">Check 1 more change to approve. Approve changes before downloading.</span>
                <span className="lp-flag-a"><span className="btn lp-mini lp-off">Approve</span><span className="btn lp-mini lp-off">Download PDF</span></span>
              </div>
            </div>
            <figcaption>The CV text is sample data.</figcaption>
          </figure>
        </div>
      </section>

      <section className="lp-sec lp-sec-s">
        <div className="lp-wrap lp-split lp-6-6">
          <div className="lp-text">
            <h2>Follow up</h2>
            <p>Analytics show your response rate and which sources reply.</p>
          </div>
          <div className="lp-proof">
            <p className="lp-list-lbl" id="lp-next-lists">Next steps lists</p>
            <ul className="lp-list" aria-labelledby="lp-next-lists">
              <li>Upcoming interviews</li>
              <li>Tasks</li>
              <li>Response deadlines</li>
              <li>Applications with no reply after 7 days</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="tools" className="lp-sec lp-sec-l">
        <div className="lp-wrap lp-split lp-4-8">
          <div className="lp-text">
            <h2>Free tools</h2>
          </div>
          <div className="lp-proof">
            <div className="lp-tools">
              {FREE_TOOLS.map((t) => (
                <div key={t.slug} className="lp-tool">
                  <h3>{t.title}</h3>
                  <p>{t.description}</p>
                  <Link href={`/tools/${t.slug}`} className="btn btn-q">Open</Link>
                </div>
              ))}
            </div>
            <p className="lp-fine">Take-home salary calculator: estimates only, based on simplified tax assumptions. Not tax or financial advice.</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="lp-sec">
        <div className="lp-wrap lp-split lp-3-9">
          <div className="lp-text">
            <h2>Pricing</h2>
          </div>
          <div className="lp-proof">
            <div className="lp-plans">
              {PLANS.map((p) => (
                <div key={p.tier} className="lp-plan">
                  <h3>{p.name}</h3>
                  <div className="lp-price"><span className="lp-price-v">{p.price}</span> <span className="lp-price-p">{p.per}</span></div>
                  <ul>
                    {p.lines.map((l) => (<li key={l}>{l}</li>))}
                  </ul>
                  <div className="lp-plan-act">
                    {p.tier === 'free' ? (
                      <Link href="/auth/sign-up" className="btn btn-q">Start free</Link>
                    ) : (
                      // Payments are not live yet, so paid plans can't be bought.
                      <button type="button" className="btn btn-q" disabled aria-disabled="true">Coming soon</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="lp-fine">Paid plans are coming soon. Everything on the free plan works today.</p>
          </div>
        </div>
      </section>

      <section id="faq" className="lp-sec lp-sec-s lp-last">
        <div className="lp-wrap lp-split lp-5-7">
          <div className="lp-text">
            <h2>Questions</h2>
          </div>
          <div className="lp-proof faq lp-faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}<Plus aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
