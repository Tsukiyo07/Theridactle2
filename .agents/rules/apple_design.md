---
description: Apple Human Interface Guidelines (HIG) and universal design principles for AitherMap UI/UX
always_on: true
---

# Apple Human Interface Guidelines (HIG) & Design Rules for AitherMap

All UI/UX development and modifications in this project MUST strictly follow the Apple Human Interface Guidelines (HIG) principles, adapted for modern cross-platform web applications.

## 1. Core Design Principles
- **Clarity**: Text must be legible at every size, icons must be precise and lucid, and adornments should be subtle and appropriate. Focus on primary content.
- **Deference**: Fluid motion, crisp layouts, and translucent materials defer to the user's content and creative workflow without cluttering the screen.
- **Depth**: Visual layers, realistic lighting, shadows, and subtle blur effects communicate hierarchy and spatial relationships.

## 2. Typography & Hierarchy
- **Font Stack**: Always use high-quality system typography:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```
- **Scale & Weight**:
  - **Large Title / Modal Header**: `16px - 18px`, `font-weight: 700`
  - **Section Header / Subtitle**: `11px - 12px`, `font-weight: 700`, uppercase, `letter-spacing: 0.05em`, color `#64748b`
  - **Body / Item Label**: `13px - 14px`, `font-weight: 500`, color `#f1f5f9`
  - **Captions / Pills / Badges**: `10px - 11px`, `font-weight: 600`
- **Line Height & Spacing**: Maintain generous vertical rhythm (e.g., 4px, 8px, 12px, 16px, 24px grid).

## 3. Materials, Elevation & Dark Mode
- **Layer Elevation**:
  - **Canvas Base**: Deepest layer (`#0c0c12` / `#0f0f14`)
  - **Sidebars / Toolbars / Chrome**: Mid layer (`#13131c` / `#161622` with `border: 1px solid rgba(255,255,255,0.06)`)
  - **Cards / List Items**: Elevated surface (`#1c1c28`, hover `#242436`, border `1px solid rgba(255,255,255,0.08)`)
  - **Modals / Floating Panels**: Top elevated surface with glassmorphism:
    ```css
    background: rgba(26, 26, 36, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05);
    ```

## 4. Color & Contrast Accessibility
- **WCAG AA Compliance**: Ensure a minimum contrast ratio of `4.5:1` for normal text and `3:1` for large text/icons against dark backgrounds.
- **Semantic Colors**:
  - Primary Accent: Purple `#7c3aed` / Light Purple `#a78bfa`
  - Success: Emerald `#10b981`
  - Warning: Amber `#f59e0b`
  - Danger / Destructive: Rose `#ef4444`
  - Info: Sky `#38bdf8`

## 5. Interaction & Feedback
- **Click / Touch Targets**: Minimum interactive hit area of `28px × 28px` on desktop (`44px × 44px` for primary touch actions).
- **Smooth State Transitions**: All hover, active, and focus transitions should use `transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Focus Rings & Hover**: Subtle luminance increase or 1px accent outline instead of jarring color jumps.
- **Destructive Actions**: Always provide confirmation or undo (`Ctrl+Z`) support for destructive actions.

## 6. Layout & Spatial Consistency
- **Padding & Margin Multiples**: Use standard 4px/8px modular units (4, 8, 12, 16, 20, 24px).
- **Corner Radii Hierarchy**:
  - Small badges/chips: `4px - 6px`
  - Buttons & list rows: `8px - 10px`
  - Containers & Cards: `12px`
  - Floating Sheets / Modals: `16px - 20px`

## 7. Progressive Disclosure & Context
- Do not overload dialogs or main screens with unnecessary controls.
- Use context menus, popovers, and dedicated focused sheets with live previews for deep customization.
- Keep default tools clean and intuitive.
