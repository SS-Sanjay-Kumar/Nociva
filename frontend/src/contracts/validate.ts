import type { ZodType } from 'zod'

/**
 * Thrown when a backend response fails its zod contract. Carries enough
 * detail (the failing field path) to show a useful error without ever
 * rendering a half-validated verdict or crashing the component tree.
 */
export class ContractError extends Error {
  readonly path: string
  readonly issues: { path: string; message: string }[]

  constructor(context: string, issues: { path: string; message: string }[]) {
    const first = issues[0]
    const path = first?.path || '(root)'
    super(`Unexpected response from service: ${context} did not match the expected shape at "${path}".`)
    this.name = 'ContractError'
    this.path = path
    this.issues = issues
  }
}

export function parseWithSchema<T>(schema: ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join('.') : '(root)',
    message: issue.message,
  }))
  throw new ContractError(context, issues)
}
