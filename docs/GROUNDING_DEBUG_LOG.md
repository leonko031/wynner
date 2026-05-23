# Grounding debug log

This is the runbook for capturing real grounded-call diagnostics when a
discovery stage falls back to offline mode despite the fixes shipped in
commit `1cb9f9b` (Fix grounded scan calls).

## How to capture a log

1. **Enable verbose logging** — set in your `.env.local`:

   ```
   GEMINI_DEBUG=true
   ```

   (In `NODE_ENV=development` it's already on automatically. The env var
   forces it on in production builds if you ever need to diagnose live.)

2. **Restart the dev server** so the new env is picked up.

3. **Trigger a Deep Research scan** on a typical product such as:
   - Name: `Bluetooth sleep mask`
   - Country: Germany
   - Suggested price: `€34`

4. **Capture the server-side logs.** Every grounded call writes lines
   prefixed `[GEMINI_GROUNDING_DEBUG]`. Either:
   - Watch `npm run dev` stdout
   - On Vercel: `vercel logs --since=10m | grep GROUNDING_DEBUG`

5. **Paste the relevant block below** in this file (or in an issue) so
   we can iterate. Each block looks like this:

   ```
   [GEMINI_GROUNDING_DEBUG] landscape attempt 1 — calling { model: 'gemini-2.5-pro', tools: [ 'googleSearch' ], promptChars: 2841 }
   [GEMINI_GROUNDING_DEBUG] landscape attempt 1 — raw response { chars: 1842, first200: '...', last100: '...' }
   [GEMINI_GROUNDING_DEBUG] landscape attempt 1 — succeeded { finishReason: 'STOP', sourceCount: 7, queryCount: 4 }
   ```

   When something fails you'll see one of:

   ```
   [GEMINI_GROUNDING_DEBUG] voice attempt 1 — parse failed { reason: '...', text: '...' }
   [GEMINI_GROUNDING_DEBUG] voice attempt 1 — schema failed { reason: '...', issues: [...], parsedJson: '...' }
   [GEMINI_GROUNDING_DEBUG] voice attempt 1 — exception { name: 'Error', message: '...' }
   ```

   Followed by a corrective second attempt, then if both fail:

   ```
   [GEMINI_GROUNDING_DEBUG] voice — all grounded attempts failed, falling back to ungrounded { finalError: '...' }
   ```

## What the fixes solved

The previous failure mode was: `responseMimeType: "application/json"` + `tools:
[{ googleSearch: {} }]` in the same generationConfig. Gemini rejects this with
a generic 400, and the retry loop fell through to the ungrounded fallback for
every grounded discovery stage. The diagnostic logs would have shown that
error on the first attempt every time.

Commit `1cb9f9b` removed the conflicting `responseMimeType`, added prompt-
level JSON discipline, a corrective-retry loop, and per-tier concurrency
caps. Schemas were widened with `.passthrough()` and default values to
tolerate the natural variance in grounded responses.

## If a stage still falls back

Copy the full `[GEMINI_GROUNDING_DEBUG]` block for that stage below this
line. Most useful: the `first200` of the raw response (shows whether
Gemini returned JSON at all) and the `issues` array from a schema failure
(tells us exactly which field tripped validation).

```
(paste captured logs here)
```

Common root causes and what to do:

| Symptom | Likely cause | Fix |
|---|---|---|
| `first200` starts with `Sorry, I can't ...` or HTML | Free-tier API key — grounding requires paid tier | Upgrade key at https://aistudio.google.com/app/apikey |
| `finishReason: SAFETY` or `MAX_TOKENS` | Model hit a safety filter or token cap | Loosen prompt language; this is rare for product research |
| `parse failed` with a JSON snippet | Gemini wrapped JSON in markdown despite the discipline suffix | The `parseJson` helper handles this — if it still fails, paste the snippet |
| `schema failed` with a path like `topAdvertisers.0.adAngle` | A field's constraint is too strict for the actual response | Widen the schema field in `lib/ai/prompts/discovery/{stage}.ts` |
| `exception: timeout` after 90s | Pro grounding genuinely took too long | Switch that stage to `flash` model in RESEARCH_MODE_META |
| `exception: 429` or rate-limit message | Hit Gemini per-key rate limit | Lower the Semaphore cap in `lib/ai/research-engine.ts` |

## Verifying the fix is in place

Quick check that the changes deployed correctly:

```bash
grep -n "responseMimeType" lib/ai/gemini.ts
# Should ONLY find it inside the ungrounded `jsonConfig` helper or
# `geminiJSON`. Should NOT find it inside `geminiWithGrounding`.

grep -n "JSON_DISCIPLINE_SUFFIX" lib/ai/gemini.ts
# Should find the constant definition + 1 usage inside geminiWithGrounding.

grep -n "Semaphore" lib/ai/research-engine.ts
# Should find the class + one instantiation in launchDiscovery.
```
