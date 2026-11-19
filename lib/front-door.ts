/**
 * Story 1.106 (U-18): switches for the front door's parts that wait on billing (Decision #109:
 * screens say only what the system can do today).
 *
 * - SALES_OPEN: the no-plan guard's plan cards, "Continue to payment", Check and pay and Stripe
 *   (U-21, S-19). Closed until launch: the guard offers the waitlist.
 * - PAY_FIRST_SIGNUP: the lines for a payer who closed the tab before setting a password
 *   (front-door-password.html, "payer: …"). S-19 switches it on with pay-first sign-up.
 */
export const SALES_OPEN = false

export const PAY_FIRST_SIGNUP = false
