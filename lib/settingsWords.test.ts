import { describe, expect, it } from 'vitest'

import type { AccountSummary, CheckTimes } from '@/lib/api/account'

import {
  checkTimesLine,
  consentLine,
  deleteSearchesLine,
  deleteTyped,
  emailError,
  emailPending,
  formatPhone,
  hasTexts,
  memberSince,
  nearMissNote,
  passwordError,
  planLine,
  quietWarning,
  testTextError,
  testTextNote,
  textsNote,
} from './settingsWords'

const ct = (zone: string, ...times: [string, string, boolean][]): CheckTimes => ({
  timezone: 'America/Los_Angeles',
  timezoneName: zone,
  times: times.map(([local, label, withinQuietHours]) => ({
    at: '2026-11-19T14:00:00.000Z',
    local,
    label,
    withinQuietHours,
  })),
})

const account = (plan: AccountSummary['plan'], inUse = 6, entitled = 10) =>
  ({
    plan,
    slots: { entitled, inUse, free: entitled - inUse, over: 0 },
  }) as unknown as AccountSummary

describe('settingsWords (Story 1.104)', () => {
  it('phone numbers: a US number in its national form; any other as stored', () => {
    expect(formatPhone('+15550142290')).toBe('(555) 014-2290')
    expect(formatPhone('15550142290')).toBe('(555) 014-2290')
    expect(formatPhone('+447911123456')).toBe('+447911123456')
    expect(formatPhone('')).toBeNull()
    expect(formatPhone(null)).toBeNull()
  })

  it('member since: the date in Eastern, even late in the evening UTC', () => {
    expect(memberSince('2026-08-13T02:30:00Z')).toBe('August 12, 2026')
    expect(memberSince(undefined)).toBeNull()
    expect(memberSince('not a date')).toBeNull()
  })

  it('plan line and texts: hidden with no plan; App Only has no texts; an unread account keeps them', () => {
    expect(
      planLine(
        account({ code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true })
      )
    ).toBe('Collector · 6 of 10 slots in use')
    expect(planLine(account(null))).toBeNull()
    expect(planLine(null)).toBeNull()
    expect(
      hasTexts(
        account({ code: 'app_only', name: 'App Only', includedSlots: 4, textsIncluded: false })
      )
    ).toBe(false)
    expect(hasTexts(account(null))).toBe(true)
    expect(hasTexts(null)).toBe(true)
  })

  it('texts and the test text name the number; with no number they say to add one', () => {
    expect(textsNote(true, '+15550142290')).toBe(
      'Texts go to (555) 014-2290. Every match also shows in Alerts.'
    )
    expect(textsNote(false, '+15550142290')).toBe('Texts are off. Matches still show in Alerts.')
    expect(textsNote(true, null)).toBe('Add a phone number above to get texts.')
    expect(testTextNote('+15550142290', false)).toBe('Check that texts reach (555) 014-2290.')
    expect(testTextNote('+15550142290', true)).toBe(
      'Sent to (555) 014-2290. It should arrive within a minute.'
    )
    expect(testTextError('RATE_LIMITED')).toBe(
      'You’ve sent 3 test texts today. Try again tomorrow.'
    )
    expect(testTextError('SMS_DELIVERY_FAILED')).toBe('Couldn’t send the test text. Try again.')
  })

  it("consent: the moment on the subscriber's clock; an unreadable zone falls back to Eastern", () => {
    expect(consentLine('2026-08-12T22:14:00Z', 'America/Los_Angeles')).toBe(
      'You agreed to receive texts from Grail Seeker on August 12, 2026 at 3:14 PM. Reply STOP to any text to end them.'
    )
    expect(consentLine('2026-08-12T22:14:00Z', 'Not/AZone')).toContain('at 6:14 PM')
    expect(consentLine(null, 'America/New_York')).toBeNull()
  })

  it("near misses: the server's margin", () => {
    expect(nearMissNote(0.15)).toBe(
      'Also alert me to books up to 15% over my maximum price. They are marked "Near miss" in Alerts.'
    )
    expect(nearMissNote(0.2)).toContain('up to 20% over')
    expect(nearMissNote(undefined)).toContain('a little over')
  })

  it("check times: the server's labels and zone; says every match is texted only when nothing is covered", () => {
    const none = ct('Pacific Time', ['06:00', '6:00 AM', false], ['16:00', '4:00 PM', false])
    expect(checkTimesLine(none)).toBe(
      'Your searches are checked at 6:00 AM and 4:00 PM Pacific Time. Both checks fall outside these hours, so every match is texted.'
    )
    expect(quietWarning(none)).toBeNull()
    const morning = ct('Pacific Time', ['06:00', '6:00 AM', true], ['16:00', '4:00 PM', false])
    expect(checkTimesLine(morning)).toBe(
      'Your searches are checked at 6:00 AM and 4:00 PM Pacific Time.'
    )
    expect(quietWarning(morning)).toEqual({
      heading: 'These hours cover your morning check, at 6:00 AM',
      body: 'Matches it finds won’t be texted. They still show in Alerts.',
    })
    expect(
      quietWarning(ct('Eastern Time', ['09:00', '9:00 AM', false], ['19:00', '7:00 PM', true]))
        ?.heading
    ).toBe('These hours cover your evening check, at 7:00 PM')
    expect(
      quietWarning(ct('Pacific Time', ['06:00', '6:00 AM', true], ['16:00', '4:00 PM', true]))
    ).toEqual({
      heading: 'These hours cover both checks',
      body: 'No match will be texted. Every match still shows in Alerts.',
    })
  })

  it('check times: three checks (none today) read with commas, and partial cover is counted', () => {
    const three = ct(
      'Eastern Time',
      ['09:00', '9:00 AM', true],
      ['13:00', '1:00 PM', false],
      ['19:00', '7:00 PM', true]
    )
    expect(checkTimesLine(three)).toBe(
      'Your searches are checked at 9:00 AM, 1:00 PM and 7:00 PM Eastern Time.'
    )
    expect(quietWarning(three)).toEqual({
      heading: 'These hours cover 2 of your 3 checks',
      body: 'Matches they find won’t be texted. They still show in Alerts.',
    })
    expect(
      checkTimesLine(
        ct(
          'Eastern Time',
          ['09:00', '9:00 AM', false],
          ['13:00', '1:00 PM', false],
          ['19:00', '7:00 PM', false]
        )
      )
    ).toMatch(/Every check falls outside these hours/)
    expect(checkTimesLine(ct('Eastern Time'))).toBe('')
  })

  it("password answers by the provider's code, never its text", () => {
    expect(passwordError('current_password_mismatch')).toEqual({
      field: 'current',
      text: 'That isn’t your current password.',
    })
    expect(passwordError('current_password_required').field).toBe('current')
    expect(passwordError('same_password')).toEqual({
      field: 'new',
      text: 'That’s the password you have now. Choose a new one.',
    })
    expect(passwordError('weak_password').field).toBe('new')
    expect(passwordError(undefined)).toEqual({
      field: 'form',
      text: 'Couldn’t change your password. Try again.',
    })
  })

  it('email: two links while Secure email change is on; errors by code', () => {
    expect(emailPending('mia@new.example', 'mia@old.example')).toEqual({
      heading: 'Check both inboxes',
      body: 'We sent a link to mia@new.example and one to mia@old.example. Open both to finish the change. Until then, your email stays mia@old.example.',
    })
    expect(emailError('email_exists')).toBe('That email is already used by another account.')
    expect(emailError('over_email_send_rate_limit')).toBe('Couldn’t send the link. Try again.')
  })

  it('delete: the searches line by count, and DELETE typed in any case', () => {
    expect(deleteSearchesLine(6)).toBe('Your 6 searches stop and are deleted.')
    expect(deleteSearchesLine(1)).toBe('Your 1 search stops and is deleted.')
    expect(deleteSearchesLine(0)).toBeNull()
    expect(deleteTyped(' delete ')).toBe(true)
    expect(deleteTyped('DELET')).toBe(false)
  })
})
