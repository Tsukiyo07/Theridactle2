---
description: Emil Kowalski's Design Engineering & UI Polish Rules for CaraGames / Theridactle
always_on: true
---

# Emil Kowalski's Design Engineering & UI Polish Guidelines

All UI, component design, micro-interactions, animations, and styling in CaraGames must strictly follow Emil Kowalski's design engineering principles (from `emilkowalski/skills` and `animations.dev`).

## 1. Core Philosophy: "Taste is Trained & Unseen Details Compound"
- **Beauty is leverage**: Good defaults, tactile feedback, and crisp micro-interactions make software feel great.
- **Invisible correctness**: When every detail functions with natural responsiveness, users love the product without knowing why.

## 2. Animation & Interaction Decision Framework
- **Do not animate high-frequency repeated actions**: Actions repeated tens/hundreds of times a day (e.g. keyboard shortcuts, canvas strokes) must be instant.
- **Duration Guidelines**:
  - Button press feedback: `100ms - 150ms`
  - Small popovers & tooltips: `125ms - 200ms`
  - Dropdowns & menus: `150ms - 220ms`
  - Modals & dialogs: `200ms - 300ms`
- **Custom Easing (Never use default CSS ease or ease-in)**:
  - Strong Ease-Out for entry & clicks: `cubic-bezier(0.23, 1, 0.32, 1)`
  - Smooth Ease-In-Out for morphing/motion: `cubic-bezier(0.77, 0, 0.175, 1)`
  - Drawer / Sheet curve: `cubic-bezier(0.32, 0.72, 0, 1)`
- **Scale Rules**:
  - Elements entering never scale from `0`. Use `transform: scale(0.95); opacity: 0` transitioning to `scale(1); opacity: 1`.
  - Buttons MUST feel responsive: `transform: scale(0.97)` on `:active` with instant feedback.

## 3. Component Craft & Micro-Interactions
- **Buttons**:
  - Always have clear `:hover` (slight luminosity bump or background glow) and `:active` (scale 0.97) states.
  - Distinct hierarchy (Primary filled gradient, Secondary ghost/translucent, Destructive red tint).
- **Popovers & Context Menus**:
  - Translucent frosted glass with `backdrop-filter: blur(24px) saturate(180%)`.
  - Subtle 1px borders (`rgba(255, 255, 255, 0.08)`) with multi-layered elevation shadows.
- **Typography & Layout**:
  - Apple SF Pro / System font stack with sub-pixel antialiasing.
  - Spacing grid: Multiples of 4px / 8px (8, 12, 16, 20, 24px).
  - Clear hierarchy with distinct weights and WCAG AA contrast.
