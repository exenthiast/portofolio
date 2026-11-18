import snapshot from './generated/content.json'
import type { Content } from '../schemas/content'

/**
 * Content snapshot written by `scripts/pull-content.ts` before every build
 * (or the committed fallback when Supabase is not configured).
 * It is validated against `contentSchema` at build time, so zod never ships in the public bundle.
 */
export const content = snapshot as Content
