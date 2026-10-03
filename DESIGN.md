# Master Design System & Art Direction Guidelines
**CaraGames / Theridactle Ecosystem**
*Synthesized from: Awwwards-Level Art Direction, 21st.dev, Magic UI, Impeccable (Paul Bakaus), Apple Design HIG (Dick Wu), Distilled Aesthetics (Anthropic Cookbook), Awesome CursorRules (PatrickJS), and Emil Kowalski Design Engineering.*

---

## 1. Aesthetic Enforcement (Zero-AI-Slop & Awwwards Standard)
- **Break Symmetrical Boredom**: Use asymmetrical visual rhythm, diagonal flow, and varied content density.
- **Zero Generic Typefaces**: Explicitly ban Inter, Roboto, Arial, and system defaults. Pair Outfit 850/900 (Display) with JetBrains Mono 700 (Data Tokens) and Plus Jakarta Sans (Body).
- **No Random Floating Blobs**: Replace aimless floating circles with intentional radial ambient lighting meshes, spotlights, and directional glowing border beams.
- **Zero Emojis**: 100% clean, geometric, 2px stroke SVG icons (Lucide / Tabler standards).

## 2. Defined Artistic Philosophy: "Luxury Cyber-Arcade / Editorial Dark"
- **Surface Materiality**: Obsidian dark foundation (#07090e), layered frosted glass (ackdrop-filter: blur(24px) saturate(180%)), and 1px specular highlight rims (inset 0 1px 0 rgba(255, 255, 255, 0.12)).
- **Physical Texture**: Analog micro-grain noise overlay (.noise-overlay, 3% opacity) giving physical weight and tactile realism.
- **Lighting Physics**: Targeted spotlight hovers, chromatic glow accents, and responsive edge refraction.

## 3. Design Tokens Architecture
- **Spacing Grid**: Strict 4px/8px baseline (8px, 12px, 16px, 24px, 32px, 48px, 64px).
- **Typography Tokens**:
  - --font-title: 'Outfit', sans-serif (letter-spacing: -0.03em)
  - --font-mono: 'JetBrains Mono', monospace (letter-spacing: 0.06em, uppercase tags)
  - --font-body: 'Plus Jakarta Sans', sans-serif
- **Semantic Palette Matrix**:
  - Theridactle: Emerald #10b981 / Mint #34d399
  - Pokédactle / PokéCries: Electric Amber #f59e0b / Solar Gold #fbbf24
  - Merrydactle / Loup-Garou: Grand Line Crimson #ef4444 / Blood Moon #dc2626
  - Quiz Géographie: Oceanic Cyan #00f2fe / Deep Teal #06b6d4
  - L'Imposteur / Songless: Classified Magenta #ec4899 / Ultraviolet #a855f7

## 4. Agency-Grade Component Assembly (21st.dev / Magic UI Standards)
1. **Interactive Spotlight Cards**: Radial gradient glow anchored to top-right or tracking cursor.
2. **Tactile Micro-Feedback**: Physical instantaneous compression (:active { transform: scale(0.97); }) under 100ms.
3. **Staggered Orchestration**: Entrances powered by Anime.js with cubic-bezier(0.23, 1, 0.32, 1) easing.
4. **Accessible Focus Gates**: Clear :focus-visible rings for keyboard navigation.
