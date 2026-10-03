---
name: bencium-ux
description: UX design fundamentals, tactile response under 100ms, direct manipulation patterns, and motion specs.
---

# Bencium UX Design Guidelines

## Interaction & Motion Rules

1. **Immediate Feedback**:
   - Interactive feedback under 100ms on \pointerdown\ (\:active { transform: scale(0.97); }\).
2. **Forgiveness & Confirmation**:
   - Always confirm destructive or game-quitting actions with sleek in-site modals.
3. **Motion Constraints**:
   - Durations between 150ms and 300ms.
   - Ease-out curves (\cubic-bezier(0.23, 1, 0.32, 1)\) for arrivals; never \ease-in\.
