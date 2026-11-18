import snapshot from './generated/content.json'
import { contentSchema, type Content } from '../schemas/content'

/**
 * Content snapshot written by `scripts/pull-content.ts` at build time
 * (or committed fallback when Supabase is not configured).
 * Parsed once so a malformed snapshot fails loudly instead of rendering garbage.
 */
export const content: Content = contentSchema.parse(snapshot)
