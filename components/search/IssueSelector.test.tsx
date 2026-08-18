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

  it('renders the one-shot read-only state for a series with exactly one issue', async () => {
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

    renderWithProviders(
      <IssueSelector seriesId={SERIES_ID} seriesTitle="Test Series" value={emptyValue} onChange={vi.fn()} />
    )

    await waitFor(() => expect(screen.getByText(/one-shot/)).toBeInTheDocument())
    // No field, no button -- nothing interactive.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
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

  it('collapses silently to the resolved chip on a unique exact-number match at blur', async () => {
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
