# CaraGames / Theridactle Development & Design Guidelines

## 1. Impeccable Style Philosophy (`https://impeccable.style/`)
All frontend UI/UX, layouts, typography, microcopy, visual assets, and components in this project MUST strictly adhere to the **Impeccable Style System** (`https://impeccable.style/`) and anti-slop rules:

### A. The Core Anti-Slop Principles (No AI Tells / No Slop):
1. **No Clunky / Amateur SVG Doodles**:
   - Never generate hand-coded sketchy or amateurish SVG drawings.
   - Use clean, geometric, professional vector icon sets (Lucide / Tabler / Feather SVG standards) with consistent 2px stroke width, rounded line-caps, and proper `viewBox="0 0 24 24"`.
2. **No Side-Tab Borders & Card Over-Decorations**:
   - Avoid thick colored single-edge stripes on rounded cards (classic AI slop tell).
   - Avoid combining a hairline border with a wide diffuse shadow simultaneously — commit to either a crisp boundary OR soft layered elevation.
3. **No Cardocalypse (Nested Over-Carding)**:
   - Never nest cards inside cards inside cards with redundant padding, borders, and shadows. Structure layout with subtle surface shifts, dividers, or clear spatial rhythm.
4. **Proportional Shape & Corner Radii**:
   - Cards top out at `12px` to `20px` border-radius depending on size. Never over-round small cards into blobs (`24px+` on small cards is prohibited). Full-pill shapes (`border-radius: 9999px`) are strictly reserved for buttons, badges, and search inputs.
5. **No Decorative Background Grids / Repeating Stripes**:
   - Avoid purposeless background grids or striped gradient bands that distract from content. Use rich dark themes with subtle atmospheric glows or clean surfaces.
6. **No "Purple Gradient Everywhere"**:
   - Color palettes must be deliberate, semantic, and high-contrast. Use theme-coherent colors (Emerald for Theridactle, Amber for Pokédactle, Magenta for Imposteur, Cyan for Géo, Crimson for Loup-Garou, Violet/Neon for Songless/Music).
7. **Strict Typography Hierarchy & Readability**:
   - Never use flat type sizing (aim for at least 1.25x scale ratio between hierarchical steps).
   - No functional text smaller than `11px`.
   - Avoid cheesy tracked uppercase kickers above every heading. Say it clearly and directly.
8. **Crisp UX Writing (No Redundant Filler)**:
   - Clear, punchy, active microcopy. Never write label + sublabel + helper text saying the same thing 3 times.

---

## 2. Design Engineering & UI Polish (Emil Kowalski & Apple Guidelines)
Follow Emil Kowalski's **Design Engineering Principles** (`animations.dev` & `.agents/skills/`):

1. **Tactile Feedback on Interactive Elements**:
   - Every button, card, tab, badge, and pressable element MUST have `:active { transform: scale(0.97); }` (or `scale(0.98)` for large cards) with instant physical response.
2. **Custom Easings (Never default `ease` or `ease-in`)**:
   - Strong Ease-Out: `cubic-bezier(0.23, 1, 0.32, 1)` for entry, hovers, and feedback.
   - Natural Spring / Sheet: `cubic-bezier(0.32, 0.72, 0, 1)` for panels, drawers, and modal transitions.
   - Never use `ease-in` for UI animations.
3. **Natural Entrances (Never `scale(0)`)**:
   - Elements entering animate from `scale(0.95); opacity: 0` to `scale(1); opacity: 1` in under 250ms.
4. **Specific Transition Properties (Avoid unconstrained `all`)**:
   - Transition only GPU-accelerated properties: `transform`, `opacity`, `background-color`, `border-color`, `box-shadow`.
5. **High-Frequency Restraint**:
   - Never animate high-frequency repeated keyboard shortcuts or real-time text parsing/typing. Instant responsiveness is the absolute priority.
6. **Glassmorphism & Depth**:
   - Frosted glass surfaces with `backdrop-filter: blur(16px) saturate(180%)`, subtle borders (`1px solid rgba(255, 255, 255, 0.08)`), and soft multi-layered elevation shadows.
7. **Accessibility & Device Support**:
   - Always include `@media (prefers-reduced-motion: reduce)` to disable motion transforms for users with motion sensitivity.
   - Ensure clean tactile response and prevent sticky hover states on touch devices.


