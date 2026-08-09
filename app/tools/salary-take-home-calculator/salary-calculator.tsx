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
    allowance: 0,
    // New regime FY2023-24 slabs (approx), incl. standard deduction handled below.
    brackets: [
      { upTo: 300000, rate: 0 },
      { upTo: 600000, rate: 0.05 },
      { upTo: 900000, rate: 0.1 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 },
    ],
    note: 'Based on India\u2019s new tax regime slabs (approx). Excludes cess, surcharge, and exemptions.',
  },
  {
    code: 'US',
    label: 'United States',
    currency: 'USD',
    symbol: '$',
    allowance: 14600, // 2024 single standard deduction
    brackets: [
      { upTo: 11600, rate: 0.1 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    note: 'Federal income tax only (2024, single filer). Excludes state tax, FICA, and credits.',
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
    note: 'England/Wales income tax bands (2024-25). Excludes National Insurance and Scotland bands.',
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
  return Math.round(tax)
}

export function SalaryCalculator() {
  const [country, setCountry] = useState<CountryTax>(COUNTRIES[0])
  const [salaryInput, setSalaryInput] = useState('')

  const gross = Math.max(0, Number(salaryInput.replace(/[^0-9.]/g, '')) || 0)

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
                onChange={(e) => setSalaryInput(e.target.value)}
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
