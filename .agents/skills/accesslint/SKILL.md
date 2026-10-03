---
name: accesslint
description: WCAG 2.1 Level AA accessibility auditing, color contrast checking, ARIA attributes, and keyboard operability.
---

# AccessLint - Accessibility Standards (WCAG 2.1 AA)

## Standards Checklist

1. **Perceivable**:
   - Text contrast >= 4.5:1 for normal text, >= 3:1 for large text (>18pt).
   - Informative SVG icons must include \ria-label\ or \	itle\, decorative SVGs should use \ria-hidden="true"\.
2. **Operable**:
   - Full keyboard operability (Tab, Shift+Tab, Enter, Space, Escape).
   - Dynamic dialogs must have \ole="dialog"\, \ria-modal="true"\, and focus traps.
3. **Understandable**:
   - Form inputs have associated labels and clear placeholders.
   - Error messages are announced with \ria-live="polite"\.
