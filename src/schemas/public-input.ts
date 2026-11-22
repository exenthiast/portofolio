import { z } from 'zod'

export const botTokenSchema = z.string().min(1).max(2048)
export const analyticsNameSchema = z.enum(['page_view', 'cv_open', 'cv_download', 'project_open', 'badge_open', 'terminal_command', 'contact_copy_email'])
export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(200).email(),
  body: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional(),
  botToken: botTokenSchema,
}).strict()
export const analyticsSessionSchema = z.object({ botToken: botTokenSchema }).strict()
export const eventInputSchema = z.object({
  name: analyticsNameSchema,
  label: z.string().max(120).nullable().optional(),
  path: z.string().max(200).startsWith('/'),
  proof: z.string().regex(/^\d{10}\.[a-f0-9]{64}$/),
}).strict()
