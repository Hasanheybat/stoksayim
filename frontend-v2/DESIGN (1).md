# Design System Document: High-End Inventory Management

## 1. Overview & Creative North Star
**Creative North Star: "The Ethereal Efficient"**
This design system moves beyond the rigid, boxy nature of traditional inventory management. It rejects the "industrial" look in favor of a sophisticated, editorial experience. By blending the precision of a professional tool with the airy, premium feel of high-end lifestyle apps, we create a workspace that feels like a curated gallery of data rather than a cluttered warehouse.

The system breaks the "standard template" look through **Intentional Asymmetry** and **Tonal Depth**. Navigation is anchored in deep, authoritative tones, while the main canvas utilizes expansive whitespace and layered surfaces to suggest infinite scalability and professional calm.

---

## 2. Colors
Our palette is a sophisticated exploration of purples, moving from deep, intellectual indigos to ethereal lavenders. 

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a card component using `surface-container-lowest` (#ffffff) should sit atop a `surface` (#f7f9fb) background to define its edges naturally.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
*   **Base Layer:** `surface` (#f7f9fb) – The primary canvas.
*   **Sectional Layers:** `surface-container-low` (#f2f4f6) – Used for grouping large content blocks.
*   **Active Elements:** `surface-container-lowest` (#ffffff) – Reserved for the highest priority cards and interactive containers.

### The "Glass & Gradient" Rule
To add "soul" to the interface:
*   **Glassmorphism:** Use `primary` (#4343d5) at 10-15% opacity with a `backdrop-filter: blur(20px)` for floating navigation overlays or dropdown menus.
*   **Signature Textures:** Main Action Buttons (CTAs) should utilize a subtle linear gradient from `primary` (#4343d5) to `primary-container` (#5d5fef) at a 135-degree angle. This provides a tactile, premium depth that flat color cannot replicate.

---

## 3. Typography
We utilize a dual-typeface system to balance authority with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern personality. Large scales (`display-lg` to `headline-sm`) should be used sparingly to create editorial "breathing points" in a data-heavy environment.
*   **Body & Labels (Inter):** The workhorse of the system. Inter’s high x-height ensures maximum legibility in dense inventory lists and data grids.

**Hierarchy as Identity:** 
- Use `headline-sm` in `primary` (#4343d5) for dashboard section titles to instill confidence. 
- Use `label-md` in `on-surface-variant` (#464555) for metadata to create a clear visual distinction between data and labels.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not structural lines.

*   **The Layering Principle:** Stack `surface-container-lowest` cards on a `surface-container-low` background. This creates a "soft lift" that feels architectural rather than digital.
*   **Ambient Shadows:** For elements that must float (e.g., Modals, Popovers), use a multi-layered shadow:
    - `box-shadow: 0px 4px 20px rgba(67, 67, 213, 0.06), 0px 10px 40px rgba(25, 28, 30, 0.04);`
    - The shadow is tinted with the `primary` hue to feel like ambient light reflecting off a purple surface.
*   **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use `outline-variant` (#c7c4d7) at **15% opacity**. Never use 100% opacity borders.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `on-primary` text, `md` (0.75rem) roundedness.
*   **Secondary:** `surface-container-highest` fill with `primary` text. No border.
*   **Tertiary:** Transparent background, `primary` text, underlined only on hover.

### Cards & Lists
*   **The Divider Ban:** Card groups and list items must **never** use divider lines. Use `8px` of vertical whitespace or a transition from `surface-container-low` to `surface-container-lowest` to denote separation.
*   **Status Chips:** Use `tertiary-container` (#9945e8) for active states with `on-tertiary-container` text. Shapes must be `full` (pill-shaped) to contrast against the `md` roundedness of cards.

### Input Fields
*   **Style:** Minimalist. `surface-container-low` background, no border. On focus, transition to `surface-container-lowest` with a "Ghost Border" of `primary` at 20% opacity.
*   **Error State:** Use `error` (#ba1a1a) only for the helper text and a 2px left-accent bar, rather than outlining the entire box in red.

### Custom Component: The "Inventory Spark"
A micro-chart component used within list items. It uses a `primary` to `tertiary` gradient line to show stock trends over 7 days, providing instant visual context without needing to open a detail view.

---

## 6. Do's and Don'ts

### Do
*   **Do** embrace negative space. If a dashboard feels "empty," it means it’s working.
*   **Do** use asymmetrical layouts for headers—e.g., placing the page title on the left and primary actions floating in a "Glass" container on the right.
*   **Do** use `tertiary` (#7f23cd) for accent moments, such as notification dots or "New" badges, to break the primary purple monotony.

### Don't
*   **Don't** use black (#000000). Always use `on-surface` (#191c1e) for text to maintain the soft, high-end feel.
*   **Don't** use harsh 90-degree corners. Even the largest containers should use at least `sm` (0.25rem) roundedness.
*   **Don't** use standard "drop shadows." If a shadow is visible as a "grey smudge," it is too heavy. It should feel like a subtle glow.
*   **Don't** use high-contrast dividers. They clutter the mind and the screen. Trust the tonal shifts.