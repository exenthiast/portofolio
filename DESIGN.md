# DESIGN.md — Visual Direction & Design System
**Alfiz Desta Portfolio Platform (`alfizdesta.com`)**
*Engineered under the strict House Rules of `tasteskill v2` (Anti-Slop Frontend Standard)*

---

## 1. The Core Idea & Art Direction

### 1.1 The Idea Sentence (Subject-Derived)
> **"On this page, Alfiz Desta's backend engineering craftsmanship (the UNIX terminal, Virtual File System, and system architecture) becomes an authentic developer console—crisp, tactile, high-contrast, and deliberate, without decorative cyber-slop or purple gradients."**

### 1.2 The Competitor Test (Passed)
* **Failed Category Default:** Generic dark-mode portfolios with glowing violet borders, floating pill badges saying "Open to Work", fake matrix code rain, and icon grids with 50 skill logos.
* **Why this belongs only to Alfiz:** Real student-engineer at Universitas Gadjah Mada (UGM), real production backend architectures (SIM Pondok Tahfidz with Laravel 13 & PostgreSQL, SIA UGN, Bimbel Lazuardy), verified Credly badges, and a functional in-browser terminal backed by a Virtual File System (VFS).

### 1.3 The One Live Thing
* **An Interactive In-Browser Terminal Emulator (VFS CLI):**
  * Supports real keyboard commands (`whoami`, `neofetch`, `cat ./about.md`, `ls -la ./projects`, `tail -f ./experience.log`, `clear`).
  * Features **Clickable Command Pills** for mobile and non-technical recruiters (tap to execute without typing).
  * Has a plain fallback that renders semantic HTML without requiring JavaScript execution.

---

## 2. Anti-Slop House Rules (Banned vs. Required)

These rules are non-negotiable. Every element is measured against them to prevent AI-generated visual cliches:

| Banned Pattern (AI Slop Tell) | Status | What We Do Instead |
| :--- | :--- | :--- |
| **Violet / Indigo / Cyan Gradients** | **BANNED** | Solid, honest monochrome palette with a single surgical emerald accent (`#059669`). |
| **Floating Pill Badges ("New", "Available for work")** | **BANNED** | A functional coordinate status bar: clean text with a solid indicator dot, left-anchored. |
| **Eyebrows / Tiny Tracked Uppercase Kickers** | **BANNED** | Fold the context directly into the headline or supporting sentence. No `text-xs uppercase tracking-widest` labels above headings. |
| **Thin 1px Hairline Outlines on Every Box** | **BANNED** | Surfaces are separated by a **single tone step** (e.g. `#f4f4f5` surface on `#fafbff` ground) and generous whitespace. |
| **Soft Grey Drop Shadows on Things at Rest** | **BANNED** | Flat surfaces. Shadows exist **only** on elements that physically float (the active dragged card, the opened Modal Drawer, the image lightbox). |
| **Gradients on Buttons or Text** | **BANNED** | 100% solid ink. Headlines use high-contrast solid typography; buttons use solid dark fills with crisp white text. |
| **Monospace Outside Real Code Blocks** | **BANNED** | Monospace is reserved exclusively for the Terminal Emulator (`data-ui="terminal"`), shell prompts, and code snippets. All UI text uses modern editorial sans-serif. |
| **Headlines Longer than 2 Lines** | **BANNED** | Every heading (`h1`–`h6`) is strictly clamped to **maximum 2 lines** at every screen width (desktop, tablet, mobile). |
| **Identical Rows of Icon Feature Cards** | **BANNED** | Each section has its own unique compositional geometry derived from its content (terminal console, scattered card spread, structured ledger). |
| **Glassmorphism / Heavy Backdrop Blur** | **BANNED** | Solid, opaque surfaces. No muddy translucent panels that hurt legibility. |

---

## 3. Color System & Surface Tokens

The palette is built on **high-contrast architectural contrast**: a surgical off-white canvas with deep obsidian terminal slabs.

```css
:root {
  /* Ground: 75% of the page (Crisp, clean, architectural) */
  --bg: #fafbff;
  --bg-subtle: #f4f5fa;

  /* Surfaces: Tone steps, no lines */
  --surface: #ffffff;
  --surface-raised: #f1f2f8;
  --surface-terminal: #0c0d12;      /* Deep obsidian stone for terminal windows */
  --surface-terminal-header: #181920;

  /* Ink: High readability */
  --ink: #09090b;                  /* Deepest charcoal (Primary headlines & body) */
  --ink-secondary: #52525b;        /* Muted supporting copy (Passes WCAG AAA) */
  --ink-terminal: #e4e4e7;         /* High-contrast terminal output text */
  --ink-terminal-muted: #a1a1aa;   /* Terminal paths & comments */

  /* The One Accent: < 5% of any screen */
  --accent: #059669;               /* Surgical Emerald (Terminal prompt, live status) */
  --accent-ink: #ffffff;

  /* macOS Traffic Light Controls */
  --mac-close: #ff5f56;
  --mac-minimize: #ffbd2e;
  --mac-maximize: #27c93f;
}
```

### Proportional Balance:
* **Ground (`--bg`):** 70–80% of viewable area.
* **Surfaces (`--surface` & `--surface-terminal`):** 15–25%.
* **Accent (`--accent`):** Strictly under 5%. Appears only on the terminal prompt symbol (`~$`), active status indicator, and interactive action highlights.

---

## 4. Typography System

**Maximum 2 Font Families:**
1. **Primary Interface & Display:** `Geist Sans` (or `Plus Jakarta Sans`) — Neutral, sharp, modern geometric grotesk.
2. **Terminal Engine & Code (`data-ui="terminal"`):** `Geist Mono` (or `JetBrains Mono`) — Authentic monospace for the CLI, command pills, and VFS paths.

### 4.1 Strict 5-Step Type Scale
No intermediate mushy sizes. Each step is clearly distinct:

```css
:root {
  /* 1. Display: Hero Name (Alfiz Desta) */
  --step-display: clamp(2.75rem, 1.5rem + 5.5vw, 6rem);    /* 44px -> 96px, tracking -0.04em, leading 0.95 */

  /* 2. Heading: Section Titles (max 2 lines) */
  --step-head: clamp(1.875rem, 1.25rem + 2.5vw, 3.25rem);  /* 30px -> 52px, tracking -0.03em, leading 1.05 */

  /* 3. Lead: Section intros, statements */
  --step-lead: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);      /* 18px -> 24px, leading 1.4 */

  /* 4. Body: Running paragraphs, card descriptions */
  --step-body: clamp(1rem, 0.95rem + 0.2vw, 1.125rem);     /* 16px -> 18px, leading 1.6 (Never < 16px) */

  /* 5. Small: Metadata, tags, terminal details */
  --step-small: clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem); /* 13px -> 14px, leading 1.4 */
}
```

---

## 5. Section-by-Section Blueprints & Compositions

### 5.1 Hero Section: The Quad-Terminal Overview
* **Desktop Composition (1440px):**
  * Canvas: Pure `--bg` (`#fafbff`).
  * Center: Available status pill (`Available for work / Yogyakarta, ID`) with subtle breathing emerald beacon.
  * Dominant Typography: **Alfiz Desta** (line 1), **Ariant Permana** (line 2) at `--step-display`, bold solid black.
  * CTA Group: 
    * Primary Button: Solid black pill/rounded-xl: *"See What I've Built"* (smooth scrolls to Projects).
    * Secondary Button: Solid subtle surface: *"Download CV"*.
  * **The 4 Neofetch Cards:**
    * **Card 1 (Top Left, angled -4°):** `~/project/2025-2026` · Metric: 4 Active Projects · Tech badge stack.
    * **Card 2 (Top Right, angled +4°):** `~/badges/alfiz` · Metric: 10 Credly Badges · Verified Cloud & Security.
    * **Card 3 (Bottom Left, angled -3°):** `~/experience/2024-2026` · Divisions & Organizations · Focus on hover.
    * **Card 4 (Bottom Right, angled +3°):** `~/alfiz/portfolio` · Software Engineer @ UGM.
* **Mobile Composition (<= 768px — The Second Composition):**
  * The angled cards do NOT overflow or collide.
  * Instead, they collapse into a **tactile 2x2 flat bento grid** underneath the headline and action buttons.

### 5.2 The Signature Motion: Scrollytelling Card Morph
* As the user scrolls from Hero into Section 2:
  * **Card 4 (`~/alfiz/portfolio`)** expands via Framer Motion `layoutId="about-window"` into the full-width **About Terminal Window**.
  * The transition uses a physical spring (`stiffness: 140, damping: 24`).
  * If `prefers-reduced-motion` is active: Instant crossfade without positional travel.

### 5.3 About Section: The macOS Terminal Console
* **Window Frame:** Solid obsidian `#0c0d12` with traffic light buttons (`#ff5f56`, `#ffbd2e`, `#27c93f`), centered path `~/alfiz/about`, and live time stamp.
* **Left Column:** `alfizdesta:~$ cat ./about.md` with interactive developer profile portrait.
* **Right Column:** High-contrast statement typography detailing education at Universitas Gadjah Mada (UGM) and backend engineering passions.
* **Scroll Departure:** Profile picture slides and stacks as the project cards prepare to scatter into the next section.

### 5.4 Projects Section: The Engineering Ledger & Modal Drawer
* **Card Scatter Animation:** Cards disperse smoothly downward, settling into a structured, high-density project showcase.
* **Projects Shown:**
  1. **SIM Pondok Tahfidz:** Backend Developer · PHP 8.3, Laravel 13, PostgreSQL, Sanctum, Docker.
  2. **SIA UGN:** Backend Developer · High concurrency student information system.
  3. **Bimbel Lazuardy:** Frontend Developer · Vue 3 + Vite, Pinia, Tailwind CSS.
* **The Interaction (Modal Drawer):**
  * Clicking any project card opens an **In-Page Slide-Over Modal Drawer** (using Vaul / Radix Sheet).
  * Contains: Architecture diagram, database schema preview, API documentation excerpts, and live demo buttons.
  * The main page scroll position and background remain untouched.

### 5.5 Badges & Credentials Section: Self-Hosted Proof
* **Visual Structure:** Clean 5-column grid (desktop) / 2-column grid (mobile) displaying the 10 Credly badges.
* **Asset Rule:** All badges are self-hosted `.webp` assets loaded from `/public/badges/` (0% CORS failure risk, < 50ms load time).
* **Click Interaction:** Opens a centered credential inspection modal showing: Badge Title, Issuer (Google Cloud, etc.), Issue Date, Credential ID, verified skills, and a direct verification link to Credly.

### 5.6 Contact Section: The macOS Terminal Session
* **Header:** `alfizdesta — ~/contact — zsh`
* **Interactive Command:** `alfizdesta:~$ ./contact`
* **Interactive Email Element:**
  * Displays: `alfizdestaap@gmail.com`
  * Action 1: Click to copy to clipboard with instant feedback toast (`$ copied to clipboard!`).
  * Action 2: Direct button *"Open in email client"* (`mailto:`).
* **Social Links:** Plain monospace links to GitHub (`/exenthiast`), LinkedIn (`/alfiz-desta`), Instagram (`/d.destaz`).
* **Terminal Exit:** `alfizdesta:~$ exit`

### 5.7 Footer: Architectural Close
* Clean, flat white close (not a generic link cemetery).
* Left: **Alfiz Desta Ariant Permana** · *Software Engineering, Universitas Gadjah Mada*.
* Right: `© 2026 Alfiz Desta. All rights reserved.`

---

## 6. Interaction & Motion Physics (Framer Motion Engine)

### 6.1 Physics Tokens
```typescript
export const springPhysics = {
  tactile: { type: "spring", stiffness: 260, damping: 20 },      // Button presses, pills
  morph: { type: "spring", stiffness: 140, damping: 24, mass: 0.8 }, // Card to window morph
  smooth: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }            // Modals, drawers, opacity
};
```

### 6.2 Motion Budget (No Lag, No Distraction)
* **Rule:** Max 1 simultaneous heavy layout animation.
* Elements outside the current viewport are paused via CSS/intersection observer.
* **Reduced Motion:** If `@media (prefers-reduced-motion: reduce)` is enabled, all `layoutId` animations collapse to instant opacities (0ms duration).

---

## 7. Figma / Figcraft Design Blueprint Checklist

When creating the design file in Figma / Figcraft, follow this checklist to ensure 100% adherence to this document:

1. **Frames / Canvases to create:**
   - [ ] `Desktop - 1440px` (Hero, About Expanded, Projects, Badges, Contact Terminal, Footer).
   - [ ] `Mobile - 390px` (Recomposed 2x2 Hero Bento, Single-column Terminal, 2-column Badges).
   - [ ] `Overlay - Project Detail Drawer` (Slide-over panel from right / bottom on mobile).
   - [ ] `Overlay - Badge Inspection Modal` (Centered clean dialog).
2. **Components to build:**
   - [ ] Terminal Window Bar (Traffic light circles: 12px red/yellow/green, title label, timestamp).
   - [ ] Hero Neofetch Card (Header with folder path, metric number, stack pill list).
   - [ ] Project Card (Mockup container, category badge, title, repo/live buttons).
   - [ ] Credly Badge Card (Square `.webp` container, issuer name, title).
   - [ ] Terminal CLI Block (Input prompt, blinking cursor, clickable pill tags).
3. **Color Styles in Figma:**
   - Create only the tokens defined in Section 3 (`--bg`, `--surface`, `--surface-terminal`, `--ink`, `--accent`).
   - Strictly avoid adding drop shadows or gradients to resting components.

---
*Document Version: 1.0.0 (Anti-Slop Edition) · Fully synced with `PRD.md`*
