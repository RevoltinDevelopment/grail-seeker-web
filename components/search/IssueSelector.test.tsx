import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIError } from '@/lib/api/client'
import { renderWithProviders } from '@/test-utils/renderWithProviders'
import type { SeriesIssuesResponse, IssueSearchResponse } from '@/types/issue.types'
import { IssueSelector, type IssueSelectorValue } from './IssueSelector'

vi.mock('@/lib/api/issues', () => ({
  issuesAPI: { list: vi.fn(), search: vi.fn() },
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above, not alphabetical order
import { issuesAPI } from '@/lib/api/issues'

const SERIES_ID = '11111111-1111-1111-1111-111111111111'

const emptyValue: IssueSelectorValue = {
  issueNumber: '',
  issueId: null,
  issueVolumeText: null,
  issuePublicationYear: null,
  resolvedSeriesId: null,
}

function fourColorLikeResponse(): SeriesIssuesResponse {
  return {
    layoutMode: 'list',
    hasMultipleVolumes: false,
    volumes: [
      {
        volume: null,
        hasBuckets: false,
        buckets: [
          {
            issues: [
              {
                number: '1',
                title: 'Little Joe',
                sortCode: 1,
                plainIssueId: 'issue-1',
                variants: [],
                volume: null,
                noVolume: true,
                displayVolumeWithNumber: false,
                publicationYear: 1942,
                seriesId: SERIES_ID,
              },
              {
                number: '4',
                title: "Smilin' Jack",
                sortCode: 4,
                plainIssueId: 'issue-4',
                variants: [],
                volume: null,
                noVolume: true,
                displayVolumeWithNumber: false,
                publicationYear: 1943,
                seriesId: SERIES_ID,
              },
            ],
          },
        ],
      },
    ],
  }
}

describe('IssueSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the one-shot read-only state and auto-resolves via onChange for a series with exactly one issue', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue({
      layoutMode: 'grid',
      hasMultipleVolumes: false,
      volumes: [
        {
          volume: null,
          hasBuckets: false,
          buckets: [
            {
              issues: [
                {
                  number: '1',
                  title: null,
                  sortCode: 1,
                  plainIssueId: 'only-issue',
                  variants: [],
                  volume: null,
                  noVolume: true,
                  displayVolumeWithNumber: false,
                  publicationYear: 1975,
                  seriesId: SERIES_ID,
                },
              ],
            },
          ],
        },
      ],
    })
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Test Series" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByText(/one-shot/)).toBeInTheDocument())
    // No field, no button -- nothing interactive.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    // Code review finding (CRITICAL): a one-shot series has exactly one
    // possible pick, so it must resolve itself via onChange -- otherwise
    // value.issueNumber stays '' and the parent form's submit button stays
    // permanently disabled with no visible error.
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        issueNumber: '1',
        issueId: null, // flag off in this test -- AC #8
        issueVolumeText: null,
        issuePublicationYear: 1975,
        resolvedSeriesId: SERIES_ID,
      })
    )
  })

  it('renders the legacy plain-text field, unchanged, when the series has no GCD data (404)', async () => {
    vi.mocked(issuesAPI.list).mockRejectedValue(new APIError(404, 'NOT_FOUND', 'No issues found'))
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Test Series" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    expect(screen.queryByText('Select Issue')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox'), '129')
    expect(onChange).toHaveBeenLastCalledWith({
      issueNumber: '129',
      issueId: null,
      issueVolumeText: null,
      issuePublicationYear: null,
      resolvedSeriesId: null,
    })
  })

  // Found live (2026-08-20): GCD issue "-1" (a real, pickable issue -- the
  // driving example behind Alias Groups, Story 1.17) was rejected by this
  // pattern in both the frontend and the matching backend validator, even
  // though it's a genuine value a gap_fill series' legacy free-text field
  // should accept.
  it('accepts a negative issue number ("-1") in the legacy no-GCD-data path', async () => {
    vi.mocked(issuesAPI.list).mockRejectedValue(new APIError(404, 'NOT_FOUND', 'No issues found'))
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Test Series" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox'), '-1')
    expect(onChange).toHaveBeenLastCalledWith({
      issueNumber: '-1',
      issueId: null,
      issueVolumeText: null,
      issuePublicationYear: null,
      resolvedSeriesId: null,
    })
  })

  it('renders field + "or" + Select Issue for a multi-issue, unresolved series', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Four Color" value={emptyValue} onChange={vi.fn()} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    expect(screen.getByText('or')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select Issue' })).toBeInTheDocument()
  })

  it('collapses silently to the resolved chip on a unique exact-number match at blur, with issueId null when the flag is off (AC #8)', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())
    vi.mocked(issuesAPI.search).mockResolvedValue({
      issues: [fourColorLikeResponse().volumes[0].buckets[0].issues[1]], // "4 - Smilin' Jack"
    })
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox'), '4')
    await user.tab() // blur

    // Code review finding (AC #8): with the flag off (unset in this test),
    // issueId must stay null even on a clean, unique match -- the flag
    // gates the FK binding itself, not just VariantSelect's rendering.
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        issueNumber: '4',
        issueId: null,
        issueVolumeText: null,
        issuePublicationYear: 1943,
        resolvedSeriesId: SERIES_ID,
      })
    )
  })

  it('binds the plain printing id on a unique exact-number match at blur when the flag is on', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_VARIANT_PICKER', 'true')
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())
    vi.mocked(issuesAPI.search).mockResolvedValue({
      issues: [fourColorLikeResponse().volumes[0].buckets[0].issues[1]], // "4 - Smilin' Jack"
    })
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox'), '4')
    await user.tab() // blur

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        issueNumber: '4',
        issueId: 'issue-4',
        issueVolumeText: null,
        issuePublicationYear: 1943,
        resolvedSeriesId: SERIES_ID,
      })
    )

    vi.unstubAllEnvs()
  })

  it('redirects to the modal (never auto-picks) when a typed number matches zero issues', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())
    vi.mocked(issuesAPI.search).mockResolvedValue({ issues: [] })
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox'), '999')
    await user.tab()

    await waitFor(() =>
      expect(screen.getByText(/'999' isn't a match for Four Color/)).toBeInTheDocument()
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  it('redirects to the modal (never auto-picks results[0]) when a typed number matches MORE THAN ONE issue (Judge-style multi-volume ambiguity)', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())
    // Simulates a Judge-style series where "#1" exists in more than one volume.
    const ambiguousMatches: IssueSearchResponse = {
      issues: [
        { ...fourColorLikeResponse().volumes[0].buckets[0].issues[0], volume: '1' },
        { ...fourColorLikeResponse().volumes[0].buckets[0].issues[0], plainIssueId: 'issue-1-vol2', volume: '2' },
      ],
    }
    vi.mocked(issuesAPI.search).mockResolvedValue(ambiguousMatches)
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox'), '1')
    await user.tab()

    await waitFor(() => expect(screen.getByText(/'1' isn't a match for Four Color/)).toBeInTheDocument())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders the resolved, collapsed chip when value.issueNumber is already set (edit-mode prefill)', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())

    const prefilled: IssueSelectorValue = {
      issueNumber: '4',
      issueId: 'issue-4',
      issueVolumeText: null,
      issuePublicationYear: 1943,
      resolvedSeriesId: SERIES_ID,
    }

    renderWithProviders(
      <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Four Color" value={prefilled} onChange={vi.fn()} />
    )

    // Resolves to the full title once issue data loads -- no flicker to
    // the unresolved (field+button) state at any point.
    await waitFor(() => expect(screen.getByText(/Smilin' Jack/)).toBeInTheDocument())
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Select to edit')).toBeInTheDocument()
  })

  describe("findResolved's volume/year disambiguation (Judge-style multi-volume)", () => {
    // Two volumes, each resetting numbering, both containing a "#1" -- the
    // exact shape findResolved's number-only fallback must disambiguate
    // correctly rather than silently binding to whichever volume happens
    // to iterate first. issueId is deliberately null throughout (the
    // "search all variants"/flag-off case), which is what routes
    // findResolved into this fallback in the first place.
    function twoVolumeJudgeStyleResponse(): SeriesIssuesResponse {
      return {
        layoutMode: 'list',
        hasMultipleVolumes: true,
        volumes: [
          {
            volume: '1963 Series',
            hasBuckets: false,
            buckets: [
              {
                issues: [
                  {
                    number: '1',
                    title: 'First Volume Issue 1',
                    sortCode: 1,
                    plainIssueId: 'v1-issue1',
                    variants: [],
                    volume: '1963 Series',
                    noVolume: false,
                    displayVolumeWithNumber: true,
                    publicationYear: 1963,
                    seriesId: SERIES_ID,
                  },
                ],
              },
            ],
          },
          {
            volume: '1998 Series',
            hasBuckets: false,
            buckets: [
              {
                issues: [
                  {
                    number: '1',
                    title: 'Second Volume Issue 1',
                    sortCode: 1,
                    plainIssueId: 'v2-issue1',
                    variants: [],
                    volume: '1998 Series',
                    noVolume: false,
                    displayVolumeWithNumber: true,
                    publicationYear: 1998,
                    seriesId: SERIES_ID,
                  },
                ],
              },
            ],
          },
        ],
      }
    }

    it('disambiguates by issueVolumeText when it matches the second volume, not the first', async () => {
      vi.mocked(issuesAPI.list).mockResolvedValue(twoVolumeJudgeStyleResponse())

      const value: IssueSelectorValue = {
        issueNumber: '1',
        issueId: null,
        issueVolumeText: '1998 Series',
        issuePublicationYear: null, // deliberately absent -- volume text alone must be sufficient
        resolvedSeriesId: SERIES_ID,
      }

      renderWithProviders(
        <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Judge Dredd" value={value} onChange={vi.fn()} />
      )

      await waitFor(() => expect(screen.getByText(/Second Volume Issue 1/)).toBeInTheDocument())
      expect(screen.queryByText(/First Volume Issue 1/)).not.toBeInTheDocument()
    })

    it('falls back to issuePublicationYear when issueVolumeText is absent', async () => {
      vi.mocked(issuesAPI.list).mockResolvedValue(twoVolumeJudgeStyleResponse())

      const value: IssueSelectorValue = {
        issueNumber: '1',
        issueId: null,
        issueVolumeText: null, // no volume signal at all -- year must carry disambiguation alone
        issuePublicationYear: 1963,
        resolvedSeriesId: SERIES_ID,
      }

      renderWithProviders(
        <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Judge Dredd" value={value} onChange={vi.fn()} />
      )

      await waitFor(() => expect(screen.getByText(/First Volume Issue 1/)).toBeInTheDocument())
      expect(screen.queryByText(/Second Volume Issue 1/)).not.toBeInTheDocument()
    })

    it('falls back to the first candidate when neither issueVolumeText nor issuePublicationYear matches any candidate', async () => {
      vi.mocked(issuesAPI.list).mockResolvedValue(twoVolumeJudgeStyleResponse())

      const value: IssueSelectorValue = {
        issueNumber: '1',
        issueId: null,
        issueVolumeText: 'Some Unrelated Reprint Edition',
        issuePublicationYear: 2050,
        resolvedSeriesId: SERIES_ID,
      }

      renderWithProviders(
        <IssueSelector source={{ kind: 'series', id: SERIES_ID }} seriesTitle="Judge Dredd" value={value} onChange={vi.fn()} />
      )

      // Neither disambiguator matches -- still resolves to something
      // sensible (array order) rather than showing nothing or crashing.
      await waitFor(() => expect(screen.getByText(/First Volume Issue 1/)).toBeInTheDocument())
      expect(screen.queryByText(/Second Volume Issue 1/)).not.toBeInTheDocument()
    })
  })

  describe('VariantSelect rollout flag', () => {
    function responseWithVariants(): SeriesIssuesResponse {
      return {
        layoutMode: 'list',
        hasMultipleVolumes: false,
        volumes: [
          {
            volume: null,
            hasBuckets: false,
            buckets: [
              {
                issues: [
                  {
                    number: '1',
                    title: 'Great Power',
                    sortCode: 1,
                    plainIssueId: 'primary',
                    variants: [{ id: 'finch-variant', variantName: 'Finch Variant' }],
                    volume: null,
                    noVolume: true,
                    displayVolumeWithNumber: false,
                    publicationYear: 2018,
                    seriesId: SERIES_ID,
                  },
                ],
              },
            ],
          },
        ],
      }
    }

    const resolvedWithVariants: IssueSelectorValue = {
      issueNumber: '1',
      issueId: 'primary',
      issueVolumeText: null,
      issuePublicationYear: 2018,
      resolvedSeriesId: SERIES_ID,
    }

    it('never renders the Variant dropdown when the flag is off, even for a group with variants', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_VARIANT_PICKER', 'false')
      vi.mocked(issuesAPI.list).mockResolvedValue(responseWithVariants())

      renderWithProviders(
        <IssueSelector
          source={{ kind: 'series', id: SERIES_ID }}
          seriesTitle="Amazing Spider-Man"
          value={resolvedWithVariants}
          onChange={vi.fn()}
        />
      )

      await waitFor(() => expect(screen.getByText('Select to edit')).toBeInTheDocument())
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

      vi.unstubAllEnvs()
    })

    it('renders the Variant dropdown when the flag is on and the resolved group has variants', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_VARIANT_PICKER', 'true')
      vi.mocked(issuesAPI.list).mockResolvedValue(responseWithVariants())

      renderWithProviders(
        <IssueSelector
          source={{ kind: 'series', id: SERIES_ID }}
          seriesTitle="Amazing Spider-Man"
          value={resolvedWithVariants}
          onChange={vi.fn()}
        />
      )

      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
      expect(screen.getByText('Cover A (standard)')).toBeInTheDocument()

      vi.unstubAllEnvs()
    })
  })

  describe('Alias Group source (Story 1.18)', () => {
    const ALIAS_GROUP_ID = '22222222-2222-2222-2222-222222222222'
    const MEMBER_SERIES_ID = '33333333-3333-3333-3333-333333333333'

    it('fetches from the Alias Group source, not the series source', async () => {
      vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())

      renderWithProviders(
        <IssueSelector
          source={{ kind: 'aliasGroup', id: ALIAS_GROUP_ID }}
          seriesTitle="Uncanny X-Men (1st Series 1963-2011)"
          value={emptyValue}
          onChange={vi.fn()}
        />
      )

      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
      expect(issuesAPI.list).toHaveBeenCalledWith({ kind: 'aliasGroup', id: ALIAS_GROUP_ID })
    })

    // AC #11 / Verified #11: an Alias Group 404 means the group has no
    // members or no real issues -- a data error, never the legitimate
    // "no GCD data" case a real series' 404 represents. Must render a
    // distinct, blocking state, never the legacy free-text <input>, and
    // must never let an invalid resolvedSeriesId reach the parent.
    it('renders a distinct blocking error state on 404, never the legacy free-text field, and never calls onChange', async () => {
      vi.mocked(issuesAPI.list).mockRejectedValue(new APIError(404, 'NOT_FOUND', 'No issues found'))
      const onChange = vi.fn()

      renderWithProviders(
        <IssueSelector
          source={{ kind: 'aliasGroup', id: ALIAS_GROUP_ID }}
          seriesTitle="Uncanny X-Men (1st Series 1963-2011)"
          value={emptyValue}
          onChange={onChange}
        />
      )

      await waitFor(() => expect(screen.getByText(/couldn't load this alias group/i)).toBeInTheDocument())
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    })

    // Code review finding: the original fix only covered the 404 case --
    // a non-404 failure (network, 500) for an Alias Group source fell
    // through to the same legacy free-text field, reproducing the exact
    // bug this story fixes via a different HTTP status. Any failure must
    // render the same distinct, blocking state.
    it('renders the same distinct blocking error state on a non-404 failure (e.g. a 500), never the legacy free-text field', async () => {
      vi.mocked(issuesAPI.list).mockRejectedValue(new Error('connection reset'))
      const onChange = vi.fn()

      renderWithProviders(
        <IssueSelector
          source={{ kind: 'aliasGroup', id: ALIAS_GROUP_ID }}
          seriesTitle="Uncanny X-Men (1st Series 1963-2011)"
          value={emptyValue}
          onChange={onChange}
        />
      )

      // useIssues's own retry() only special-cases 404 -- any other error
      // (this one included) retries up to 3 times with React Query's
      // default backoff before the query settles into its error state, so
      // this needs a longer-than-default waitFor timeout.
      await waitFor(
        () => expect(screen.getByText(/couldn't load this alias group/i)).toBeInTheDocument(),
        { timeout: 10000 }
      )
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    }, 15000)

    // The one behavior this whole story exists to get right (Dev Notes):
    // a group fetched THROUGH an Alias Group must resolve to its own real
    // member seriesId, which differs from the Alias Group's own id.
    it("resolveValueFromIssue's resolvedSeriesId is the group's real member series, not the Alias Group's own id", async () => {
      vi.mocked(issuesAPI.list).mockResolvedValue({
        layoutMode: 'grid',
        hasMultipleVolumes: false,
        volumes: [
          {
            volume: null,
            hasBuckets: false,
            buckets: [
              {
                issues: [
                  {
                    number: '44',
                    title: null,
                    sortCode: 44,
                    plainIssueId: 'issue-44',
                    variants: [],
                    volume: null,
                    noVolume: true,
                    displayVolumeWithNumber: false,
                    publicationYear: 1968,
                    seriesId: MEMBER_SERIES_ID, // real member series, NOT ALIAS_GROUP_ID
                  },
                ],
              },
            ],
          },
        ],
      })
      const onChange = vi.fn()

      renderWithProviders(
        <IssueSelector
          source={{ kind: 'aliasGroup', id: ALIAS_GROUP_ID }}
          seriesTitle="Uncanny X-Men (1st Series 1963-2011)"
          value={emptyValue}
          onChange={onChange}
        />
      )

      // A single issue with no variants auto-resolves via the one-shot
      // effect -- no textbox/blur needed, matching this file's very first
      // test's pattern.
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ resolvedSeriesId: MEMBER_SERIES_ID })
        )
      )
      expect(onChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ resolvedSeriesId: ALIAS_GROUP_ID })
      )
    })
  })
})
