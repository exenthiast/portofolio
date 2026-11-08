# TASKS.md — Engineering Roadmap & Step-by-Step Tasklist
**Alfiz Desta Portfolio Platform (`alfizdesta.com`)**

> **Petunjuk Eksekusi Agent:** 
> - Kerjakan hanya **1 sub-task** dalam satu giliran.
> - Berikan ringkasan rencana file sebelum menulis kode.
> - Verifikasi dengan `npm run build` sebelum mencentang `[x]` pada task.

---

## Phase 0: Design Phase (Figma / Figcraft First)
- [ ] **Task 0.1:** Buat artboard Desktop (1440px) & Mobile (390px) di Figma berdasarkan [`DESIGN.md`](file:///Users/pizzparker/Downloads/DESIGN.md).
- [ ] **Task 0.2:** Desain 4 Quad Neofetch Cards & transisi morphing Card 4 ke About window.
- [ ] **Task 0.3:** Desain tampilan Slide-over Project Detail Drawer & Credly Badge Modal.
- [ ] **Task 0.4:** Export aset gambar pendukung (.webp): 10 Credly badges, 3 screenshot mockup proyek, foto profil.

---

## Phase 1: Project Initialization & Design Tokens Setup
- [x] **Task 1.1:** Inisialisasi project React 19 + TypeScript + Vite.
  - Setup git repo lokal, buat branch `dev`, dan buat branch `feature/init-project`.
- [x] **Task 1.2:** Konfigurasi Tailwind CSS v4 & load font `Geist Sans` + `Geist Mono`.
- [x] **Task 1.3:** Setup design tokens CSS variables di `src/styles/tokens.css` sesuai Section 3 [`DESIGN.md`](file:///Users/pizzparker/Downloads/DESIGN.md).
- [x] **Task 1.4:** Integrasi Lenis Smooth Scroll di `src/main.tsx`.

---

## Phase 2: Data Architecture & Types (Single Source of Truth)
- [ ] **Task 2.1:** Buat TypeScript interface murni di `src/types/` (`project.ts`, `badge.ts`, `experience.ts`, `terminal.ts`).
- [ ] **Task 2.2:** Buat file data konten di `src/data/`:
  - `profile.ts` (Bio, kontak, social links, headline)
  - `projects.ts` (SIM Pondok Tahfidz, SIA UGN, Bimbel Lazuardy)
  - `badges.ts` (10 Credly badges metadata)
  - `experience.ts` (KMTEDI UGM, BKLASS, TED, BLASTOUT, training)

---

## Phase 3: Base UI Primitives & Navbar
- [ ] **Task 3.1:** Buat komponen atomik di `src/components/ui/` (Button, TrafficLightDots, Toast, Modal).
- [ ] **Task 3.2:** Buat komponen Navbar minimalis:
  - Logo inisial + nama "Alfiz Desta" + subtitle "Software Engineer".
  - Navigasi link (Overview, About, Projects, Experience, Badges, Contact).
  - Quick action buttons (GitHub & LinkedIn).

---

## Phase 4: Hero Section & Quad Neofetch Cards
- [ ] **Task 4.1:** Buat layout Hero Desktop (1440px):
  - Status badge penanda lokasi: `Available for work / Yogyakarta, ID`.
  - Nama display besar 2 baris: `Alfiz Desta` / `Ariant Permana`.
  - Action buttons: "See What I've Built" & "Download CV".
- [ ] **Task 4.2:** Implementasi 4 Neofetch Cards di 4 sudut:
  - Card 1: `~/project/2025-2026`
  - Card 2: `~/badges/alfiz`
  - Card 3: `~/experience/2024-2026`
  - Card 4: `~/alfiz/portfolio`
- [ ] **Task 4.3:** Responsive handling Mobile (390px): Transformasi 4 sudut menjadi 2x2 bento grid.

---

## Phase 5: About Section & Scrollytelling Card Morph
- [ ] **Task 5.1:** Buat layout macOS Terminal Window (`~/alfiz/about`):
  - Traffic light header (merah, kuning, hijau) + live local time.
  - Body: `cat ./about.md`, foto profil hover effect, headline, sub-headline UGM.
- [ ] **Task 5.2:** Sambungkan animasi morphing:
  - Gunakan Framer Motion `layoutId="about-window"` dari Card 4 di Hero menuju About Terminal Window saat scroll.
  - Tambahkan fallback jika `prefers-reduced-motion` aktif.

---

## Phase 6: Projects Section & Interactive Modal Drawer
- [ ] **Task 6.1:** Buat grid & card proyek dengan animasi sebaran kartu (*scatter effect*).
- [ ] **Task 6.2:** Integrasi Slide-Over Modal Drawer (Vaul / Radix Sheet) saat kartu proyek diklik:
  - Tampilkan studi kasus teknis arsitektur backend/frontend, tech stack chips, link demo & repo GitHub.
  - Pastikan scroll halaman utama di background terkunci dan tidak reload.

---

## Phase 7: Experience Timeline & Credly Badges Grid
- [ ] **Task 7.1:** Buat section Experience dengan tab navigasi: Organizations, Committees, Training.
- [ ] **Task 7.2:** Tambahkan Modal Lightbox foto dokumentasi kegiatan (high-res `.webp` + caption).
- [ ] **Task 7.3:** Buat grid 10 Badges Credly:
  - Load gambar lokal dari `/public/badges/*.webp`.
  - Tambahkan modal detail lencana saat badge diklik + link verifikasi Credly.

---

## Phase 8: In-Browser Terminal Emulator & Contact Section
- [ ] **Task 8.1:** Buat custom hook `useTerminal` dengan Virtual File System (VFS):
  - Handle perintah `help`, `whoami`, `neofetch`, `ls`, `cd`, `cat`, `clear`, `contact`.
  - Keyboard history navigation (panah atas/bawah) & shortcut `Ctrl+L`.
  - Clickable command pills untuk pengguna mobile.
- [ ] **Task 8.2:** Buat section Contact bertema terminal macOS (`./contact`):
  - Interaksi klik salin alamat email dengan toast notifikasi.
  - Tombol "Open in email app" (`mailto:`).
  - Monospace links ke GitHub, LinkedIn, Instagram.
- [ ] **Task 8.3:** Buat section Footer arsitektural bersih.

---

## Phase 9: Quality Assurance & Pre-Deployment Audit
- [ ] **Task 9.1:** Lakukan cross-browser & viewport test (Mobile 390px, Tablet 768px, Desktop 1440px).
- [ ] **Task 9.2:** Jalankan audit aksesibilitas (keyboard focus `:focus-visible`, reduced-motion check).
- [ ] **Task 9.3:** Setup OpenGraph & JSON-LD SEO schema di `index.html`.
- [ ] **Task 9.4:** Jalankan `npm run build` dan pastikan zero build warning/error.
- [ ] **Task 9.5:** Merge branch fitur ke `dev`, buat Pull Request ke `main`, dan deploy ke Vercel Edge.
