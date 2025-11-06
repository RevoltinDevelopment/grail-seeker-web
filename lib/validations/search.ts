import { z } from 'zod'

export const searchFormSchema = z.object({
  seriesId: z.number({
    required_error: 'Please select a comic series',
  }),
  issueNumber: z
    .string()
    .min(1, 'Issue number is required')
    .regex(/^(\d+|nn)$/, 'Enter number only (e.g., 1, 129) or "nn" for no number'),
  maxPrice: z.number().nullable().optional(),
  gradeMin: z.number().min(0.5).max(10).nullable().optional(),
  gradeMax: z.number().min(0.5).max(10).nullable().optional(),
  pageQuality: z.string().nullable().optional(),
  gradingAuthority: z.string().nullable().optional(),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
})

export type SearchFormData = z.infer<typeof searchFormSchema>
