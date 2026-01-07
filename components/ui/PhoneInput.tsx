'use client'

import { useState, useEffect } from 'react'

interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Common countries with their dial codes (E.164 format)
const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
]

interface PhoneInputProps {
  value: string // E.164 format (e.g., "+14155551234")
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

/**
 * Parse E.164 phone number into country code and national number
 * Handles both "+16786126743" and "16786126743" formats
 */
function parseE164(e164: string): { countryCode: string; nationalNumber: string } {
  if (!e164) {
    return { countryCode: '+1', nationalNumber: '' }
  }

  // Add + prefix if missing (Supabase sometimes stores without it)
  const normalized = e164.startsWith('+') ? e164 : `+${e164}`

  // Find matching country by dial code (longest match first)
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)

  for (const country of sortedCountries) {
    if (normalized.startsWith(country.dialCode)) {
      const nationalNumber = normalized.slice(country.dialCode.length)
      return { countryCode: country.dialCode, nationalNumber }
    }
  }

  // Fallback: assume first 1-3 digits after + are country code
  const match = normalized.match(/^(\+\d{1,3})(.*)/)
  if (match) {
    return { countryCode: match[1], nationalNumber: match[2] }
  }

  return { countryCode: '+1', nationalNumber: normalized.slice(1) }
}

/**
 * Combine country code and national number into E.164 format
 */
function toE164(countryCode: string, nationalNumber: string): string {
  if (!nationalNumber) return ''

  // Remove all non-digit characters from national number
  const digitsOnly = nationalNumber.replace(/\D/g, '')

  if (!digitsOnly) return ''

  return `${countryCode}${digitsOnly}`
}

export function PhoneInput({ value, onChange, required, className }: PhoneInputProps) {
  const { countryCode: initialCountryCode, nationalNumber: initialNationalNumber } =
    parseE164(value)

  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [nationalNumber, setNationalNumber] = useState(initialNationalNumber)

  // Sync internal state when value prop changes (e.g., when user data loads)
  useEffect(() => {
    const currentE164 = toE164(countryCode, nationalNumber)
    // Only sync if value prop is different from our current constructed value
    if (value && value !== currentE164) {
      const parsed = parseE164(value)
      setCountryCode(parsed.countryCode)
      setNationalNumber(parsed.nationalNumber)
    }
  }, [value]) // Only depend on value prop

  // Update parent when either field changes
  useEffect(() => {
    const e164 = toE164(countryCode, nationalNumber)
    if (e164 !== value) {
      onChange(e164)
    }
  }, [countryCode, nationalNumber, value, onChange])

  const handleNationalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNationalNumber(e.target.value)
  }

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryCode(e.target.value)
  }

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {/* Country Code Dropdown */}
      <select
        value={countryCode}
        onChange={handleCountryCodeChange}
        className="w-32 rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
        aria-label="Country code"
      >
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.dialCode}>
            {country.flag} {country.dialCode}
          </option>
        ))}
      </select>

      {/* Phone Number Input */}
      <input
        type="tel"
        value={nationalNumber}
        onChange={handleNationalNumberChange}
        required={required}
        className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
        placeholder="555-123-4567"
        aria-label="Phone number"
      />
    </div>
  )
}
