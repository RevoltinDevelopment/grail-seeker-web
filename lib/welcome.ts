/**
 * Story 1.89 (U-09): the welcome toast on Searches, chosen by the way the person arrived. Only
 * /welcome (an accepted invitation) sends `welcome=invited`; U-21's paid sign-up will send its own
 * value with the approved "Your search is saved" words. Anything else shows nothing.
 *
 * Story 1.106 (U-18): reset password sends `welcome=password`, the drawn "Your password is saved.
 * You're signed in." (front-door-password.html, "reset: done"), split into the toast's title and
 * line.
 */
export const WELCOME_TITLE = 'Welcome to Grail Seeker'

export const WELCOME_WORDS = {
  // Mahan, 2026-11-10: an invited tester has no search yet
  invited:
    "Your plan is ready. Build your first search and we'll check it against each of our marketplaces every day, morning and night, starting at the next check.",
  password: "You're signed in.",
} as const

const TITLES: Partial<Record<WelcomeArrival, string>> = {
  password: 'Your password is saved.',
}

export type WelcomeArrival = keyof typeof WELCOME_WORDS

function isArrival(value: string | null | undefined): value is WelcomeArrival {
  return !!value && Object.prototype.hasOwnProperty.call(WELCOME_WORDS, value)
}

export function welcomeWordsFor(value: string | null | undefined): string | null {
  return isArrival(value) ? WELCOME_WORDS[value] : null
}

export function welcomeTitleFor(value: string | null | undefined): string {
  return (isArrival(value) && TITLES[value]) || WELCOME_TITLE
}
