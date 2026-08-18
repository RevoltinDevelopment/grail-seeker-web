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
                },
              ],
            },
          ],
        },
      ],
    })
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Test Series" value={emptyValue} onChange={onChange} />
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
      })
    )
  })

  it('renders the legacy plain-text field, unchanged, when the series has no GCD data (404)', async () => {
    vi.mocked(issuesAPI.list).mockRejectedValue(new APIError(404, 'NOT_FOUND', 'No issues found'))
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Test Series" value={emptyValue} onChange={onChange} />
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
    })
  })

  it('renders field + "or" + Select Issue for a multi-issue, unresolved series', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())

    renderWithProviders(
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Four Color" value={emptyValue} onChange={vi.fn()} />
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
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
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
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
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
      })
    )

    vi.unstubAllEnvs()
  })

  it('redirects to the modal (never auto-picks) when a typed number matches zero issues', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue(fourColorLikeResponse())
    vi.mocked(issuesAPI.search).mockResolvedValue({ issues: [] })
    const onChange = vi.fn()

    renderWithProviders(
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
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
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Four Color" value={emptyValue} onChange={onChange} />
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
    }

    renderWithProviders(
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Four Color" value={prefilled} onChange={vi.fn()} />
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
      }

      renderWithProviders(
        <IssueSelector seriesId={SERIES_ID} seriesTitle="Judge Dredd" value={value} onChange={vi.fn()} />
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
      }

      renderWithProviders(
        <IssueSelector seriesId={SERIES_ID} seriesTitle="Judge Dredd" value={value} onChange={vi.fn()} />
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
      }

      renderWithProviders(
        <IssueSelector seriesId={SERIES_ID} seriesTitle="Judge Dredd" value={value} onChange={vi.fn()} />
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
    }

    it('never renders the Variant dropdown when the flag is off, even for a group with variants', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_VARIANT_PICKER', 'false')
      vi.mocked(issuesAPI.list).mockResolvedValue(responseWithVariants())

      renderWithProviders(
        <IssueSelector
          seriesId={SERIES_ID}
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
          seriesId={SERIES_ID}
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
})
