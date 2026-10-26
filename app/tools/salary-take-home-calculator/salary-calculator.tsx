'use client'

import { useMemo, useState } from 'react'

interface Bracket {
  upTo: number // upper bound of this bracket (Infinity for top)
  rate: number // marginal rate 0–1
}

interface CountryTax {
  code: string
  label: string
  currency: string
  symbol: string
  /** Locale used to group digits (India uses lakh/crore grouping). */
  locale: string
  /** Example salary for the input placeholder. */
  example: string
  /** Standard deduction / tax-free allowance applied before brackets. */
  allowance: number
  /** Allowance shrinks by `ratio` per unit of gross income above `from` (UK personal allowance taper). */
  allowanceTaper?: { from: number; ratio: number }
  brackets: Bracket[]
  /**
   * Rebate that makes taxable income up to `threshold` tax-free, with marginal
   * relief just above it (tax never exceeds the income over the threshold).
   */
  rebateThreshold?: number
  note: string
}

/**
 * Simplified, illustrative income-tax models. These are estimates only and
 * ignore many real-world factors (state/local tax, NI/cess specifics,
 * exemptions, filing status). Clearly disclaimed in the UI.
 */
const COUNTRIES: CountryTax[] = [
  {
    code: 'IN',
    label: 'India',
    currency: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    example: '1200000',
    allowance: 75000, // standard deduction for salaried taxpayers, new regime
    // New regime slabs, FY2025-26 onwards.
    brackets: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.1 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.2 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: Infinity, rate: 0.3 },
    ],
    rebateThreshold: 1200000, // section 87A rebate
    note: 'India new tax regime for salaried income (\u20b975,000 standard deduction and 87A rebate, FY2025-26). Excludes 4% cess, surcharge, and other deductions.',
  },
  {
    code: 'US',
    label: 'United States',
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    example: '85000',
    allowance: 15750, // 2025 single standard deduction
    brackets: [
      { upTo: 11925, rate: 0.1 },
      { upTo: 48475, rate: 0.12 },
      { upTo: 103350, rate: 0.22 },
      { upTo: 197300, rate: 0.24 },
      { upTo: 250525, rate: 0.32 },
      { upTo: 626350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    note: 'Federal income tax only (2025 tax year, single filer). Excludes state tax, FICA, and credits.',
  },
  {
    code: 'UK',
    label: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    example: '45000',
    allowance: 12570,
    allowanceTaper: { from: 100000, ratio: 0.5 }, // £1 lost per £2 over £100k, gone by £125,140
    brackets: [
      { upTo: 37700, rate: 0.2 }, // basic (after allowance)
      { upTo: 125140, rate: 0.4 }, // higher
      { upTo: Infinity, rate: 0.45 }, // additional
    ],
    note: 'England/Wales income tax bands (2025-26), including the personal allowance taper above £100,000. Excludes National Insurance and Scotland bands.',
  },
]

function computeTax(gross: number, country: CountryTax): number {
  const taper = country.allowanceTaper
  const allowance = taper && gross > taper.from
    ? Math.max(0, country.allowance - (gross - taper.from) * taper.ratio)
    : country.allowance
  const taxable = Math.max(0, gross - allowance)
  let tax = 0
  let lower = 0
  for (const bracket of country.brackets) {
    if (taxable <= lower) break
    const slice = Math.min(taxable, bracket.upTo) - lower
    if (slice > 0) tax += slice * bracket.rate
    lower = bracket.upTo
  }
  if (country.rebateThreshold !== undefined && taxable > 0) {
    tax = taxable <= country.rebateThreshold ? 0 : Math.min(tax, taxable - country.rebateThreshold)
  }
  return Math.round(tax)
}

const MAX_SALARY_DIGITS = 12

/** Keeps digits and a single decimal point; drops signs, letters and excess length. */
function sanitizeSalary(raw: string): string {
  const [whole, ...rest] = raw.replace(/[^0-9.]/g, '').split('.')
  const cleaned = rest.length ? `${whole}.${rest.join('')}` : whole
  return cleaned.slice(0, MAX_SALARY_DIGITS)
}

export function SalaryCalculator() {
  const [country, setCountry] = useState<CountryTax>(COUNTRIES[0])
  const [salaryInput, setSalaryInput] = useState('')

  const gross = Math.max(0, Number(salaryInput) || 0)

  const result = useMemo(() => {
    const tax = computeTax(gross, country)
    const net = gross - tax
    const effectiveRate = gross > 0 ? (tax / gross) * 100 : 0
    return { tax, net, effectiveRate }
  }, [gross, country])

  const fmt = (n: number) => `${country.symbol}${Math.round(n).toLocaleString(country.locale)}`

  return (
    <div className="tl-wrap">
      <div className="panel" style={{ padding: 20, display: 'grid', gap: 20 }}>
        <div className="tl-2">
          <div className="tl-field">
            <span className="tl-lbl" id="country-l">Country</span>
            <div className="tl-opts" role="radiogroup" aria-labelledby="country-l">
              {COUNTRIES.map((c) => (
                <button key={c.code} type="button" role="radio" aria-checked={country.code === c.code} className={`seg${country.code === c.code ? ' seg-on' : ''}`} onClick={() => setCountry(c)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="tl-field">
            <label htmlFor="salary">Gross annual salary</label>
            <div className="inp-ic">
              <span aria-hidden="true" style={{ position: 'absolute', left: 14, color: 'var(--text-muted)' }}>{country.symbol}</span>
              <input id="salary" className="inp" style={{ paddingLeft: 34 }} inputMode="decimal" value={salaryInput} onChange={(e) => setSalaryInput(sanitizeSalary(e.target.value))} placeholder={`e.g. ${country.example}`} />
            </div>
          </div>
        </div>

        <div className="tl-3" aria-live="polite">
          <div className="stat"><span className="lbl">Take-home / year</span><span className="stat-v tl-ok">{fmt(result.net)}</span></div>
          <div className="stat"><span className="lbl">Take-home / month</span><span className="stat-v">{fmt(result.net / 12)}</span></div>
          <div className="stat"><span className="lbl">Income tax / year</span><span className="stat-v tl-bad">{fmt(result.tax)}</span></div>
        </div>

        {gross > 0 ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="meter">
              <div className="meter-hd"><span>Effective tax rate</span><b>{result.effectiveRate.toFixed(1)}%</b></div>
              <div className="meter-tr"><div className="meter-fl" style={{ width: `${Math.min(100, result.effectiveRate)}%` }} /></div>
            </div>
            <div className="tl-stack" aria-hidden="true">
              <div style={{ width: `${(result.net / gross) * 100}%`, background: 'var(--st-offer)' }}>{result.net / gross > 0.12 ? 'Net' : ''}</div>
              <div style={{ width: `${(result.tax / gross) * 100}%`, background: 'var(--st-rejected)' }}>{result.tax / gross > 0.12 ? 'Tax' : ''}</div>
            </div>
          </div>
        ) : (
          <p className="tl-hint" style={{ margin: 0 }}>Enter a salary to see your take-home pay.</p>
        )}
      </div>
      <p className="tl-hint" style={{ margin: 0, maxWidth: 720 }}>{country.note} Rough estimates for comparing offers, not tax advice.</p>
    </div>
  )
}
