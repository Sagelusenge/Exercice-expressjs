---
name: KBS Real Estate System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#725a42'
  on-secondary: '#ffffff'
  secondary-container: '#fedcbe'
  on-secondary-container: '#796048'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#fedcbe'
  secondary-fixed-dim: '#e1c1a4'
  on-secondary-fixed: '#291806'
  on-secondary-fixed-variant: '#59422c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-tablet: 32px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered to project unwavering authority, stability, and professional expertise in the real estate and land management sector. The target audience includes high-net-worth investors, developers, and property owners who require a platform that feels as solid and enduring as the land itself.

The visual style is **Corporate / Modern**, leaning into a structured, architectural aesthetic. It prioritizes clarity and precision, utilizing generous whitespace to evoke a "premium" or "high-end" gallery feel for property listings while maintaining the rigorous information density required for rental management dashboards. The emotional goal is to move the user from initial interest to total confidence through a clean, systematic interface.

## Colors

This design system utilizes a foundation of high-contrast, professional tones. 
- **Primary (Deep Blue):** Used for core branding, navigation backgrounds, and primary action buttons to establish authority.
- **Secondary (Chocolate Brown):** Reserved for accents, specifically elements related to "land" or "stability," such as map markers or secondary call-to-outs.
- **Neutrals:** The background system uses a very light gray with a hint of warmth (`#F8FAFC`) to avoid a clinical feel, ensuring the interface feels approachable yet clean.
- **Muted Status Palette:** Success, warning, and error colors are intentionally desaturated and deepened to maintain the professional aesthetic without becoming visually jarring.

## Typography

The typography strategy balances the bold, architectural presence of **Montserrat** for headings with the high-utility legibility of **Inter** for data and body text.

- **Headings:** Use Montserrat with tight letter spacing and bold weights to create a sense of structure and importance.
- **Body & Data:** Use Inter for its neutral, systematic quality, which is essential for reading long-form lease agreements or complex financial tables.
- **Hierarchy:** Maintain a clear distinction between labels (all-caps or medium weights) and body text to ensure administrative dashboards are scannable.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for content-heavy pages and a **Fluid Grid** for admin dashboards to maximize screen real estate.

- **Grid:** A 12-column system is used globally. On desktop, property listings should span 3 or 4 columns, while admin sidebars occupy 2 columns.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Spaciousness:** Use "Generous" increments (32px, 48px, 64px) between sections to maintain the premium brand positioning.
- **Mobile Adaptivity:** On mobile, margins shrink to 16px and the grid collapses to a single column, ensuring property images remain high-impact.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sophisticated sense of depth without looking "gamey" or overly digital.

- **Surfaces:** The base background is the lowest level. Content sits on white cards (`#FFFFFF`).
- **Shadows:** Use extremely soft, blurred shadows with a slight blue tint (`rgba(15, 23, 42, 0.08)`) to lift cards off the background. 
- **Borders:** Subtle, low-contrast outlines (`1px solid #E2E8F0`) are used on all containers to define boundaries even when shadows are minimal. This ensures clarity in data-heavy environments.

## Shapes

The shape language is "Rounded" to soften the professional tone and make the platform feel modern and accessible. 

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Main property cards and feature sections use a 1rem (16px) radius to create a distinct, modern container.
- **Interactive Elements:** Checkboxes use a small 4px radius, while tags/chips may use a pill-shape to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Solid Primary Blue background with white text. High-contrast, no gradient.
- **Secondary:** Solid Chocolate Brown for land-specific actions (e.g., "View Plot Details") or Outlined Primary Blue for general secondary actions.
- **Tertiary:** Text-only with an underline on hover for low-priority navigation.

### Cards
- **Property Cards:** Feature a full-width image at the top, followed by 16px padding for content. Title in Montserrat, price in a prominent weight. Use a subtle shadow on hover to indicate interactivity.
- **Data Cards:** Minimalist white backgrounds with 1px borders. No shadows, focusing on internal alignment and typography hierarchy.

### Inputs & Forms
- **Fields:** 1px border in a light neutral. On focus, the border transitions to Primary Blue with a 2px outer "glow" (soft shadow).
- **Labels:** Positioned above the field in `label-md` Inter, ensuring high visibility during data entry.

### Lists & Tables
- **Admin Tables:** Use zebra-striping with the neutral background color (`#F8FAFC`). Row height should be generous (min 56px) to maintain the spacious feel.
- **Property Lists:** Use a horizontal layout on desktop with the image on the left and metadata on the right, utilizing `title-lg` for the property name.