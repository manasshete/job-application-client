import { generateText, Output, type LanguageModel } from 'ai'
import type { z } from 'zod'
import type { CheckFlag } from './verify'

/**
 * Generates structured output, runs the server checks, and when any fail asks the
 * model once to fix exactly those items. The corrected answer is kept only if it
 * fails fewer checks; whatever still fails is returned for the candidate to review.
 */
export async function generateChecked<T>({
  model,
  system,
  prompt,
  schema,
  check,
}: {
  model: LanguageModel
  system: string
  prompt: string
  schema: z.ZodType<T>
  check: (output: T) => CheckFlag[]
}): Promise<{ output: T; checks: CheckFlag[]; retried: boolean }> {
  const first = await generateText({ model, system, prompt, output: Output.object({ schema }) })
  const firstChecks = check(first.output)
  if (!firstChecks.length) return { output: first.output, checks: [], retried: false }

  try {
    const second = await generateText({
      model,
      system,
      output: Output.object({ schema }),
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: JSON.stringify(first.output) },
        { role: 'user', content: fixRequest(firstChecks) },
      ],
    })
    const secondChecks = check(second.output)
    if (secondChecks.length < firstChecks.length) return { output: second.output, checks: secondChecks, retried: true }
  } catch (err) {
    // The first answer is still usable, so a failed retry is not an error for the user.
    console.error('[generate-checked] retry failed:', err)
  }
  return { output: first.output, checks: firstChecks, retried: true }
}

function fixRequest(checks: CheckFlag[]) {
  return `Your answer failed these checks against <cv> and <candidate_notes>:
${checks.map((c) => `- ${c.message} Text: "${c.cv_reference}"`).join('\n')}

Fix each one. Rewrite it so it is supported by <cv> or <candidate_notes>, using the CV's own wording and exact numbers and currency symbols, or remove it. If a sentence about the candidate is supported, list it under "claims" with one continuous quote copied exactly from <cv>. Do not state years of experience the CV does not state. Keep the spelling variety, length and every other rule from the system prompt. Change nothing else. Return the full corrected JSON in the same format.`
}
