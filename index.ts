// Vercel AI Gateway example.
// The AI SDK reads AI_GATEWAY_API_KEY from the environment; keep the key in .env.local (git-ignored).
// Run with: node --env-file=.env.local index.ts   (Node 22.18+; older Node 22 needs --experimental-strip-types)
import { readFileSync } from 'node:fs'
import { generateText } from 'ai'

// Fallback: if the key didn't come through the environment, read it from .env.local directly.
// Never prints the key itself.
function ensureGatewayKey() {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) return 'environment'
  try {
    const text = readFileSync(new URL('./.env.local', import.meta.url), 'utf8').replace(/^﻿/, '')
    const line = text.split(/\r?\n/).find((l) => /^\s*AI_GATEWAY_API_KEY\s*=/.test(l))
    const value = line?.split('=').slice(1).join('=').trim().replace(/^(['"])(.*)\1$/, '$2')
    if (value) {
      process.env.AI_GATEWAY_API_KEY = value
      return '.env.local'
    }
  } catch {
    /* no .env.local next to this file */
  }
  return null
}

async function main() {
  const source = ensureGatewayKey()
  if (!source) {
    console.error('AI_GATEWAY_API_KEY is not set. Add it to .env.local as AI_GATEWAY_API_KEY=your_key')
    process.exit(1)
  }
  console.log(`Using AI_GATEWAY_API_KEY from ${source} (${process.env.AI_GATEWAY_API_KEY!.length} characters).`)

  const { text } = await generateText({
    model: 'moonshotai/kimi-k3',
    prompt: 'Invent a new holiday and describe its traditions.',
  })
  console.log(text)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
