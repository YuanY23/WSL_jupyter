# Design Specification: SimLab Brand Vector Assets (SVG)

This document specifies the design details for the new vector graphics (SVG) for the **SimLab** platform. The design style chosen is **Approach 3: Cold-Warm Clash Violet-Orange Gradient (Balance of Physics and Computation)**.

## Goal

Provide a set of cohesive, professional, and visually premium SVG assets representing SimLab's branding to replace the default logos/icons.

## Target Output Directory
All files will be generated in `/home/yuan/my_project/logo/`.

- `simlab-logo.svg` - Main logo for the top-left system header.
- `simlab-favicon.svg` - Favicon for the browser tab.
- `simlab-notebook.svg` - Custom Notebook icon for the workspace tabs and file explorer.

---

## Brand Visual Identity Specs

### 1. Palette & Gradients
We use a premium gradient bridging cool purple (representing numerical solvers, computing logic, cold engineering) and warm orange-red (representing physical thermal dynamics, energy, simulation):

- **Start Color (Cool/Logic)**: Violet/Indigo (`#8A2387`)
- **Mid Color (Transition/Energy)**: Crimson/Coral (`#E94057`)
- **End Color (Warm/Thermal)**: Dynamic Orange (`#F27121`)
- **Background Context**: Clean transparent background, optimized for dark or light theme borders.
- **Accents**: High contrast elements in white (`#FFFFFF`) or deep indigo (`#1A1A2E`) for solid elements.

---

## Asset Specifications

### Component 1: `simlab-logo.svg`
- **Location**: `/home/yuan/my_project/logo/simlab-logo.svg`
- **Dimensions**: ViewBox `0 0 100 100`, scalable.
- **Visual Design**: 
  - An abstract, futuristic **"S"** shape formed by two interlocking curves.
  - The left-to-bottom curve starts with deep violet, curving gracefully to represent digital solver grids and logical computation.
  - The right-to-top curve starts with dynamic thermal orange, looping back, symbolizing thermal energy flow and physical simulation.
  - They overlap in the middle with a seamless gradient transition (`#8A2387` -> `#E94057` -> `#F27121`).
  - Subtle drop-shadow/glow effects using SVG `<feDropShadow>` filters to give depth.
  - A clean rounded square boundary frame (border-radius `22`) can be optional, but we will make it standalone so it can float on any background.

### Component 2: `simlab-favicon.svg`
- **Location**: `/home/yuan/my_project/logo/simlab-favicon.svg`
- **Dimensions**: ViewBox `0 0 32 32` or `0 0 100 100`.
- **Visual Design**:
  - A circular background featuring the SimLab gradient (`#8A2387` to `#F27121`).
  - Cutout of the abstract **"S"** shape in high-contrast white in the center.
  - Extremely clear at small dimensions (16x16 / 32x32).

### Component 3: `simlab-notebook.svg`
- **Location**: `/home/yuan/my_project/logo/simlab-notebook.svg`
- **Dimensions**: ViewBox `0 0 22 22` (to match JupyterLab's default tab/sidebar icon sizing).
- **Visual Design**:
  - A clean vector outline of a notebook page (`rect` with rounded corners, a subtle right margin shadow).
  - A vertical spine on the left side with 3 spiral rings.
  - In the center/corner of the notebook, replacing the standard orange ribbon, is the custom SimLab S-curve logo filled with the violet-orange gradient, creating a unified branding experience.

---

## Verification Plan

### Automated Check
- Validate SVG syntax using local commands if needed, ensuring no malformed tags or missing namespace declarations (`xmlns`).

### Manual Inspection
- Since the user explicitly requested "generate images, I will do the rest myself, do not modify other code", we will write these files and present the SVGs.
