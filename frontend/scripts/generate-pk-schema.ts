/**
 * Generates docs/contracts/pk.schema.json from the zod schemas in
 * src/contracts/pk.ts. Run: npm run schema:pk
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { z } from 'zod'
import { SimulateResponseSchema } from '../src/contracts/pk.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../../docs/contracts')
const OUT_PATH = resolve(OUT_DIR, 'pk.schema.json')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_PATH, JSON.stringify(z.toJSONSchema(SimulateResponseSchema), null, 2) + '\n')
console.log(`Wrote ${OUT_PATH}`)
