/**
 * Series Display Name Formatting Utilities
 *
 * Centralizes all series display name formatting logic to ensure consistency
 * across the application. Matches backend database display_name generation.
 *
 * Format Examples:
 * - With volume: "Amazing Spider-Man (1st Series, 1963-1998) - Marvel"
 * - Without volume: "Inhumans Special (1990) - Marvel"
 * - No publisher: "Amazing Spider-Man (1st Series, 1963-1998)"
 */

import type { ComicSeries } from '@/types/search.types'

/**
 * Convert volume number to ordinal format
 *
 * @param volume - Volume number (1, 2, 3, etc.)
 * @returns Ordinal string (1st Series, 2nd Series, etc.) or empty string if null
 *
 * @example
 * volumeToOrdinal(1)  // "1st Series"
 * volumeToOrdinal(2)  // "2nd Series"
 * volumeToOrdinal(11) // "11th Series"
 * volumeToOrdinal(21) // "21st Series"
 */
export function volumeToOrdinal(volume: number | null | undefined): string {
  if (!volume) return ''

  // Special cases: 11th, 12th, 13th (not 11st, 12nd, 13rd)
  if (volume % 100 >= 11 && volume % 100 <= 13) {
    return `${volume}th Series`
  }

  // Standard ordinal suffixes based on last digit
  const lastDigit = volume % 10
  switch (lastDigit) {
    case 1:
      return `${volume}st Series`
    case 2:
      return `${volume}nd Series`
    case 3:
      return `${volume}rd Series`
    default:
      return `${volume}th Series`
  }
}

/**
 * Format year range for display
 *
 * @param yearRange - Year range string (e.g., "1963-1998" or "1990")
 * @returns Formatted year range
 *
 * @example
 * formatYearRange("1963-1998") // "1963-1998"
 * formatYearRange("1990")      // "1990"
 */
export function formatYearRange(yearRange: string): string {
  return yearRange
}

/**
 * Format series display name with optional publisher
 *
 * This is the main formatting function used throughout the application.
 * It matches the backend's display_name generation logic.
 *
 * @param series - Comic series object
 * @param options - Formatting options
 * @returns Formatted display string
 *
 * @example
 * // With volume and publisher
 * formatSeriesDisplay({
 *   title: "Amazing Spider-Man",
 *   volume: 1,
 *   yearRange: "1963-1998",
 *   publisher: "Marvel"
 * })
 * // Returns: "Amazing Spider-Man (1st Series, 1963-1998) - Marvel"
 *
 * @example
 * // Without volume
 * formatSeriesDisplay({
 *   title: "Inhumans Special",
 *   volume: null,
 *   yearRange: "1990",
 *   publisher: "Marvel"
 * })
 * // Returns: "Inhumans Special (1990) - Marvel"
 *
 * @example
 * // Without publisher
 * formatSeriesDisplay(
 *   {
 *     title: "X-Men",
 *     volume: 2,
 *     yearRange: "1991-2012",
 *     publisher: "Marvel"
 *   },
 *   { includePublisher: false }
 * )
 * // Returns: "X-Men (2nd Series, 1991-2012)"
 */
export function formatSeriesDisplay(
  series: ComicSeries,
  options: { includePublisher?: boolean; includeType?: boolean } = {}
): string {
  const { includePublisher = true, includeType = false } = options

  // Build series part with type if specified
  let seriesPart = series.title
  if (includeType && series.type) {
    seriesPart += ` ${series.type}`
  }

  // Build year/volume part
  let detailsPart: string
  if (series.volume) {
    detailsPart = `${volumeToOrdinal(series.volume)}, ${series.yearRange}`
  } else {
    detailsPart = series.yearRange
  }

  // Combine series name with details
  const fullSeries = `${seriesPart} (${detailsPart})`

  // Add publisher if requested
  if (includePublisher && series.publisher) {
    return `${fullSeries} - ${series.publisher}`
  }

  return fullSeries
}

/**
 * Format short series display (for cards/compact views)
 *
 * Shows just volume and year range without title
 *
 * @param series - Comic series object
 * @returns Short format string
 *
 * @example
 * formatSeriesShort({ volume: 1, yearRange: "1963-1998" })
 * // Returns: "1st Series (1963-1998)"
 *
 * @example
 * formatSeriesShort({ volume: null, yearRange: "1990" })
 * // Returns: "(1990)"
 */
export function formatSeriesShort(series: Pick<ComicSeries, 'volume' | 'yearRange'>): string {
  if (series.volume) {
    return `${volumeToOrdinal(series.volume)} (${series.yearRange})`
  }
  return `(${series.yearRange})`
}
