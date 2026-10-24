/**
 * Generates docs/contracts/review.schema.json from the zod schemas in
 * src/contracts/review.ts — those schemas are the single source of truth;
 * this file is a derived artifact, never hand-edited.
 *
 * Run: npm run schema:review
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { z } from 'zod'
import { AssessmentResultSchema } from '../src/contracts/review.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../../docs/contracts')
const OUT_PATH = resolve(OUT_DIR, 'review.schema.json')

const jsonSchema = z.toJSONSchema(AssessmentResultSchema)

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_PATH, JSON.stringify(jsonSchema, null, 2) + '\n')
console.log(`Wrote ${OUT_PATH}`)
