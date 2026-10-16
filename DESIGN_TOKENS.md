# ShopDesk Design Tokens — Source & Verification

This document records how every color/radius/shadow value in
`client/tailwind.config.ts`, `client/src/index.css`, and
`client/src/styles/tokens.ts` was derived, so nothing is presented as
"verified" that wasn't actually checked.

## Method

The 7 supplied screenshots (`/mnt/user-data/uploads/*.png`, full resolution,
1920px wide) were opened with Pillow (Python) and specific pixel regions
were cropped and reduced to their dominant color via
`Image.getcolors()`. This is **pixel extraction from the screenshots
themselves** — not a recollection of the public "Horizon UI" template's
published values, and not a Figma file (none was supplied). Several
sample points required a first coarse guess, a grid-overlay crop to
re-locate the exact coordinate, and a second, corrected sample — that
iteration is normal and is reflected in the coordinates below.

## Verified values (sampled directly, high confidence)

| Token | Value | Source image | Approx. region sampled |
|---|---|---|---|
| Light page background | `#F4F7FE` | Main_Dashboard.png | gap between header stat row and panels |
| Light surface/card background | `#FFFFFF` | Main_Dashboard.png, Tables.png, Profile.png | card interiors |
| Dark page background | `#0B1437` | Main_Dashboard__1_.png | gap between header stat row and panels |
| Dark surface/card background | `#111C44` | Main_Dashboard__1_.png | sidebar, card interiors |
| Dark secondary surface | `#1B254B` | Main_Dashboard__1_.png | card interior (secondary tone found alongside `#111C44`) |
| Brand purple (primary) | `#4318FF` | Sign_In.png, Main_Dashboard.png, Profile.png | Sign In button, light-theme checkboxes/progress fill, Profile toggle-on, storage bar fill |
| Brand purple (secondary/light accent) | `#7551FF` | Main_Dashboard__1_.png | dark-theme sidebar active indicator bar, dark-theme checked checkbox |
| Light heading/primary text | `#2B3674` | Main_Dashboard.png | "Main Dashboard" H1 |
| Dark heading/primary text | `#FFFFFF` | Main_Dashboard__1_.png | "Main Dashboard" H1 |
| Muted/secondary text | `#707EAE` | Main_Dashboard.png | breadcrumb "Pages / Dashboard" |
| Muted/tertiary (label) text | `#A3AED0` | Main_Dashboard.png | unselected sidebar nav label |
| Light border/divider | `#E4E8F4` | Sign_In.png | input field outline |
| Success | `#01B574` | Main_Dashboard__1_.png, Kanban.png | "Approved" status icon, "Done" badge |
| Danger | `#EE5D50` | Main_Dashboard__1_.png | "Disable" status icon |
| Warning | `#FFCE20` | Main_Dashboard__1_.png | "Error" status icon |
| Info | `#3965FF` | Kanban.png | "Updates" badge |
| Pending/orange | `#FFB547` | Kanban.png | "Pending" badge |
| Light toggle (off) track | `#E0E5F2` | Profile.png | notification toggle, off state |

## Estimated values (not independently pixel-verified — flagged, not asserted)

| Token | Value used | Why it's an estimate |
|---|---|---|
| Dark border/divider | `rgba(255,255,255,0.08)` | No visible hairline border was found in the sampled dark-theme regions; dark cards appear to rely on the surface/background contrast rather than a drawn border. This is a conventional placeholder, not a sampled color. |
| Border radii (`20px` / `16px` / `12px`) | — | Judged by eye from the screenshots' corner curvature at 1920px width; a flattened PNG doesn't encode exact corner radius, so these are reasonable starting points, not measurements. |
| Box shadow | `0 18px 40px -12px rgba(112,144,176,0.18)` | Shadows blend into the page background in a flat screenshot and can't be reliably isolated by pixel sampling; this is a conventional soft-elevation shadow in the same blue-gray family as the page background, not an extracted value. |
| Font family (`DM Sans`) | — | A screenshot carries no font metadata. The letterforms visually resemble a geometric/grotesque sans; `DM Sans` is offered as the closest common candidate, with system-ui/Inter fallbacks. **This needs confirmation if exact typographic fidelity matters** — it was not verified. |

## What was intentionally not measured

- Exact spacing/grid values (gutters, card padding) — the default Tailwind
  spacing scale (4px base unit) is used as-is; it was not tuned against
  the screenshots pixel-by-pixel.
- Any dimension described as "Figma measurements" — no Figma file was
  provided, only rasterized screenshots, so none are claimed.

## How to re-run or extend the sampling

The sampling scripts were run ad hoc in the container and are not saved
as a reusable script in this repo (Phase 1 scope was tokens, not tooling).
If more tokens need verification later (e.g. the dark-theme border, exact
spacing), repeat the same approach: crop a candidate region from the
source PNG with Pillow, call `Image.getcolors()` on the crop, and take the
dominant non-text, non-antialiased color. Use a grid-overlay crop first
when unsure of exact coordinates — several of the values above required
that correction step.
