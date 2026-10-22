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
  /** Standard deduction / tax-free allowance applied before brackets. */
  allowance: number
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
    allowance: 12570,
    brackets: [
      { upTo: 37700, rate: 0.2 }, // basic (after allowance)
      { upTo: 125140, rate: 0.4 }, // higher
      { upTo: Infinity, rate: 0.45 }, // additional
    ],
    note: 'England/Wales income tax bands (2025-26). Excludes National Insurance and Scotland bands.',
  },
]

function computeTax(gross: number, country: CountryTax): number {
  const taxable = Math.max(0, gross - country.allowance)
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

  const fmt = (n: number) =>
    `${country.symbol}${Math.round(n).toLocaleString('en-US')}`

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Country</label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    country.code === c.code
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="salary" className="mb-2 block text-sm font-medium text-slate-900">
              Gross annual salary
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {country.symbol}
              </span>
              <input
                id="salary"
                inputMode="numeric"
                value={salaryInput}
                onChange={(e) => setSalaryInput(sanitizeSalary(e.target.value))}
                placeholder="e.g. 1200000"
                className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Take-home / yr</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(result.net)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Take-home / mo</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(result.net / 12)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Income tax / yr</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{fmt(result.tax)}</p>
          </div>
        </div>

        {gross > 0 && (
          <>
            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                <span>Effective tax rate</span>
                <span className="font-semibold text-slate-900">
                  {result.effectiveRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min(100, result.effectiveRate)}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex overflow-hidden rounded-lg text-center text-xs font-medium">
              <div
                className="bg-emerald-500 py-1.5 text-white"
                style={{ width: `${(result.net / gross) * 100}%` }}
              >
                Net
              </div>
              <div
                className="bg-red-400 py-1.5 text-white"
                style={{ width: `${(result.tax / gross) * 100}%` }}
              >
                Tax
              </div>
            </div>
          </>
        )}

        <p className="mt-6 text-xs leading-relaxed text-slate-400">{country.note} These figures are
          rough estimates for comparison only — not tax advice.</p>
      </div>
    </div>
  )
}
