# Changelog - Grail Seeker Web Application

All notable changes to the frontend web application will be documented in this file.

---

## [Unreleased]

### Added - November 11, 2025

#### Phone Number Country Code Selector

- **New Component:** `PhoneInput.tsx` - Reusable phone input with country code dropdown
- **Feature:** International phone number support with 25 countries
- **UX Enhancement:** Flag emojis for visual country identification
- **Data Format:** Automatic E.164 format conversion for all phone numbers
- **Integration:** Updated registration page to use PhoneInput component
- **Integration:** Updated settings page to use PhoneInput component
- **Backend Compatibility:** Verified E.164 format works with Twilio SMS service

**Countries Supported:**

- North America: 🇺🇸 US, 🇨🇦 Canada, 🇲🇽 Mexico
- Europe: 🇬🇧 UK, 🇮🇪 Ireland, 🇩🇪 Germany, 🇫🇷 France, 🇪🇸 Spain, 🇮🇹 Italy, 🇳🇱 Netherlands, 🇧🇪 Belgium, 🇸🇪 Sweden, 🇳🇴 Norway, 🇩🇰 Denmark, 🇫🇮 Finland, 🇵🇱 Poland
- Asia-Pacific: 🇦🇺 Australia, 🇳🇿 New Zealand, 🇮🇳 India, 🇨🇳 China, 🇯🇵 Japan, 🇰🇷 South Korea, 🇸🇬 Singapore
- Latin America: 🇧🇷 Brazil, 🇦🇷 Argentina

**Files Added:**

- `components/ui/PhoneInput.tsx`

**Files Modified:**

- `app/(auth)/register/page.tsx` - Phone input replaced with PhoneInput component
- `app/(authenticated)/settings/SettingsClient.tsx` - Phone input replaced with PhoneInput component

**Documentation:**

- `SESSION-LOG-2025-11-11-PHONE-INPUT-ENHANCEMENT.md` - Complete implementation details
- `CHANGELOG.md` - This file

**Related Issue:** Enhancement requested by Product Owner
**Reference:** SmartRecruiters UI pattern

---

## Previous Changes

_(No changelog entries existed before November 11, 2025)_

**Notable Features Already Implemented:**

- User authentication (login, register, email verification)
- Protected routes with middleware
- Dashboard with statistics and recent alerts
- Create/Edit/List searches functionality
- Series autocomplete
- Grade range selector with auto-correction
- Alert list and filtering
- Settings page with profile management
- Account deletion
- SMS notification preferences

---

## Versioning

This project does not currently follow semantic versioning. Version numbers will be added when preparing for production release.

---

## Categories

Changes are categorized as follows:

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security-related changes

---

_Last Updated: November 11, 2025_
