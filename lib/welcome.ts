/**
 * Story 1.89 (U-09): the welcome toast on Searches, chosen by the way the person arrived. Only
 * /welcome (an accepted invitation) sends `welcome=invited`; U-21's paid sign-up will send its own
 * value with the approved "Your search is saved" words. Anything else shows nothing.
 */
export const WELCOME_TITLE = 'Welcome to Grail Seeker'

export const WELCOME_WORDS = {
  // Mahan, 2026-11-10: an invited tester has no search yet
  invited:
    "Your plan is ready. Build your first search and we'll check it against each of our marketplaces every day, morning and night, starting at the next check.",
} as const

export type WelcomeArrival = keyof typeof WELCOME_WORDS

export function welcomeWordsFor(value: string | null | undefined): string | null {
  if (value && Object.prototype.hasOwnProperty.call(WELCOME_WORDS, value)) {
    return WELCOME_WORDS[value as WelcomeArrival]
  }
  return null
}
