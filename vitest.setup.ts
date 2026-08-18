import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia -- needed by useMediaQuery
// (IssuePickerModal's desktop/mobile split, Story 1.16). Standard test-env
// polyfill, not project-specific.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom doesn't implement the Pointer Events capture APIs or
// scrollIntoView -- Radix UI's Select (VariantSelect) calls these
// internally. Standard test-env polyfill for this well-known jsdom gap,
// not project-specific.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}
