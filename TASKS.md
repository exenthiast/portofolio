# TASKS.md — Engineering Roadmap & Step-by-Step Tasklist
**Alfiz Desta Portfolio Platform (`alfizdesta.com`)**

> **Petunjuk Eksekusi Agent:** 
> - Kerjakan hanya **1 sub-task** dalam satu giliran.
> - Berikan ringkasan rencana file sebelum menulis kode.
> - Verifikasi dengan `npm run build` sebelum mencentang `[x]` pada task.

> **Urutan besar (disepakati):** Fondasi → Section publik → QA & Launch v1 → Backend Supabase → Pipeline publish → Admin Dashboard → V2.

---

## Phase 0: Design Phase (Figma / Figcraft First)
- [ ] **Task 0.1:** Buat artboard Desktop (1440px) & Mobile (390px) di Figma berdasarkan [`DESIGN.md`](./DESIGN.md).
- [ ] **Task 0.2:** Desain 4 Quad Neofetch Cards & transisi morphing Card 4 ke About window.
- [ ] **Task 0.3:** Desain tampilan Slide-over Project Detail Drawer & Credly Badge Modal.
- [ ] **Task 0.4:** Export aset gambar pendukung (.webp): 10 Credly badges, 3 screenshot mockup proyek, foto profil.
- [ ] **Task 0.5:** Desain Admin Dashboard (login `sudo login`, sidebar VFS, editor split + live preview, publish diff).

---

## Phase 1: Project Initialization & Design Tokens Setup
- [x] **Task 1.1:** Inisialisasi project React 19 + TypeScript + Vite.
  - Setup git repo lokal, buat branch `dev`, dan buat branch `feature/init-project`.
- [x] **Task 1.2:** Konfigurasi Tailwind CSS v4 & load font `Geist Sans` + `Geist Mono`.
- [x] **Task 1.3:** Setup design tokens CSS variables di `src/styles/tokens.css` sesuai Section 3 [`DESIGN.md`](./DESIGN.md).
- [x] **Task 1.4:** Integrasi Lenis Smooth Scroll di `src/main.tsx`.

---

## Phase 2: Data Architecture & Types (Single Source of Truth)
- [x] **Task 2.1:** Buat TypeScript interface murni di `src/types/` (`project.ts`, `badge.ts`, `experience.ts`, `terminal.ts`, `profile.ts`).
- [x] **Task 2.2:** Buat file data konten di `src/data/`:
  - `profile.ts` (Bio, kontak, social links, headline)
  - `projects.ts` (SIM Pondok Tahfidz, SIA UGN, Bimbel Lazuardy)
  - `badges.ts` (10 Credly badges metadata)
  - `experience.ts` (KMTEDI UGM, BKLASS, TED, BLASTOUT, training)

---

## Phase 3: Base UI Primitives & Navbar
- [x] **Task 3.1:** Buat komponen atomik di `src/components/ui/` (Button, TrafficLightDots).
- [x] **Task 3.2:** Buat komponen Navbar minimalis:
  - Logo inisial + nama "Alfiz Desta" + subtitle "Software Engineer".
  - Navigasi link (Overview, About, Projects, Experience, Badges, Contact).
  - Quick action buttons (GitHub & LinkedIn).

---

## Phase 4: Hero Section & Quad Neofetch Cards
- [x] **Task 4.1:** Buat layout Hero Desktop (1440px):
  - Status badge penanda lokasi: `Available for work / Yogyakarta, ID`.
  - Nama display besar 2 baris: `Alfiz Desta` / `Ariant Permana`.
  - Action buttons: "See What I've Built" & "Download CV".
- [x] **Task 4.2:** Implementasi 4 Neofetch Cards di 4 sudut:
  - Card 1: `~/project/2025-2026`
  - Card 2: `~/badges/alfiz`
  - Card 3: `~/experience/2024-2026`
  - Card 4: `~/alfiz/portfolio`
- [x] **Task 4.3:** Responsive handling Mobile (390px): Transformasi 4 sudut menjadi 2x2 bento grid.

---

## Phase 5: Fondasi & Hygiene (persiapan CMS)
- [x] **Task 5.1:** Fix font family: Google Fonts mendaftarkan `Geist`, bukan `Geist Sans` → `--font-sans` saat ini jatuh ke system font.
- [x] **Task 5.2:** Self-host font (`public/fonts/*.woff2` + `<link rel="preload">`), hapus request ke Google Fonts.
- [x] **Task 5.3:** Schema konten dengan `zod` di `src/schemas/` (profile, project, badge, experience); tipe di `src/types/` di-infer dari schema (`z.infer`). Schema ini dipakai ulang oleh form admin & build script. *(butuh approval dependensi `zod`)*
- [ ] **Task 5.4:** Audit kebenaran konten bersama Alfiz (tanpa klaim karangan): *(sebagian: jumlah badge & metrik hero kini dihitung dari data, Laravel 13 disamakan dengan PRD — sisanya butuh konfirmasi Alfiz, bisa diedit lewat admin)*
  - Stack SIA UGN (saat ini berasal dari placeholder PRD), versi Laravel (11 vs 13), jumlah badge (10 vs "30+"), role organisasi.
  - `credlyUrl` per badge + `credentialId`, tanggal terbit/kedaluwarsa asli.
  - Pilih satu bahasa konten (rekomendasi: English) atau siapkan struktur ID/EN.
- [x] **Task 5.5:** Hygiene aset: `previewAsset` → `.webp` + `width`/`height` di data, rename CV jadi `/cv/alfiz-desta-cv.pdf`.
- [x] **Task 5.6:** Vite multi-page: `index.html` (publik) + `admin.html` (admin, bundle terpisah) + `vercel.json` (rewrite `/admin/*`, security headers, `X-Robots-Tag: noindex` untuk admin). Buat `.env.example`.

---

## Phase 6: About Section & Scrollytelling Card Morph
- [x] **Task 6.1:** Buat layout macOS Terminal Window (`~/alfiz/about`):
  - Traffic light header (merah, kuning, hijau) + live local time.
  - Body: `cat ./about.md`, foto profil hover effect, headline, sub-headline UGM.
- [x] **Task 6.2:** Sambungkan animasi morphing:
  - Gunakan Framer Motion `layoutId="about-window"` dari Card 4 di Hero menuju About Terminal Window saat scroll.
  - Tambahkan fallback jika `prefers-reduced-motion` aktif (termasuk transform scroll Hero via `useReducedMotion`).
- [x] **Task 6.3:** Rapikan About tanpa mengubah konsep terminal:
  - Pertahankan traffic lights, path, jam WIB, dan `cat ./about.md`; hapus panel System Specifications dan bingkai bertingkat.
  - Narasi berbasis proyek nyata dapat diedit lewat **About story**; sinkron dengan VFS `about.md`.
  - Foto memakai **Profile photo** dari admin, termasuk alt dan dimensi; tetap memakai pipeline publish yang ada.
  - Verifikasi build/lint, viewport 390/768/1024/1440px, dan fallback reduced motion.

---

## Phase 7: Projects Section & Interactive Modal Drawer
- [x] **Task 7.1:** Buat grid & card proyek dengan animasi sebaran kartu (*scatter effect*).
- [x] **Task 7.2:** Integrasi Slide-Over Modal Drawer (Vaul / Radix Sheet) saat kartu proyek diklik:
  - Tampilkan studi kasus teknis arsitektur backend/frontend, tech stack chips, link demo & repo GitHub.
  - Pastikan scroll halaman utama di background terkunci dan tidak reload.
  - Drawer di-lazy-load (`React.lazy`).
- [x] **Task 7.3:** Deep link yang bisa dibagikan: `/#projects/<slug>` langsung membuka drawer (tanpa reload, back button menutup drawer).

---

## Phase 8: Experience Timeline & Credly Badges Grid
- [x] **Task 8.1:** Buat section Experience dengan tab navigasi: Organizations, Committees, Training.
- [x] **Task 8.2:** Tambahkan Modal Lightbox foto dokumentasi kegiatan (high-res `.webp` + caption).
- [x] **Task 8.3:** Buat grid 10 Badges Credly:
  - Load gambar lokal dari `/public/badges/*.webp`.
  - Tambahkan modal detail lencana saat badge diklik + link verifikasi Credly.
- [x] **Task 8.4:** Gabungkan badge dan sertifikat dalam section Credentials:
  - Tab Credly badges / Certificates dengan jumlah terpisah; tautan See all on Credly tetap terlihat.
  - Galeri sertifikat dan modal dengan gambar, metadata, PDF opsional, serta tautan verifikasi opsional.
  - Form admin dengan pilihan jenis credential, media picker gambar/PDF, serta alur draft/publish yang ada.
  - Pertahankan kompatibilitas data Credly lama dan pisahkan PDF sertifikat dari riwayat CV.
  - Build/lint, tes schema/pipeline, dan browser 390/768/1440px (termasuk reduced motion) lolos.
- [x] **Task 8.5:** Dukung sertifikat PDF tanpa gambar terpisah:
  - Satu Certificate file picker menerima PDF/gambar; PDF disimpan asli dan schema menerima PDF-only.
  - Galeri memakai tile dokumen PDF; modal memakai preview PDF native dan tombol Open PDF.
  - Build/lint, tes schema/pipeline, serta simulasi upload/simpan PDF di desktop/mobile lolos, termasuk PDF berekstensi huruf besar tanpa MIME dari browser.
- [x] **Task 8.6:** Buat thumbnail halaman pertama PDF secara otomatis:
  - `pdfjs-dist` disetujui Alfiz; PDF.js/worker dimuat hanya saat pemrosesan admin.
  - Pilihan/upload PDF menghasilkan preview WebP lewat media pipeline yang ada; PDF asli tetap disimpan.
  - PDF lama memakai Generate preview tanpa upload ulang; kegagalan render menjaga PDF dan menyediakan retry.
  - Build/lint, tes regresi, serta browser 390/1440px lolos: auto-thumbnail, PDF lama, retry, publish metadata, dan tidak ada request PDF.js dari halaman publik.
  - PDF sertifikat yang sudah tersimpan diuji render secara read-only; tidak mengubah konten/publish pengguna.

---

## Phase 9: In-Browser Terminal Emulator & Contact Section
- [x] **Task 9.1:** Buat custom hook `useTerminal` dengan Virtual File System (VFS):
  - VFS **di-generate dari `src/data/`** (tidak ada konten duplikat).
  - Handle perintah `help`, `whoami`, `neofetch`, `ls`, `cd`, `cat`, `clear`, `contact`, `open` (`open projects/<slug>` membuka drawer).
  - Keyboard history navigation (panah atas/bawah) & shortcut `Ctrl+L`.
  - Clickable command pills untuk pengguna mobile.
- [x] **Task 9.2:** Buat section Contact bertema terminal macOS (`./contact`):
  - Interaksi klik salin alamat email dengan toast notifikasi.
  - Tombol "Open in email app" (`mailto:`).
  - Monospace links ke GitHub, LinkedIn, Instagram.
- [x] **Task 9.3:** Buat section Footer arsitektural bersih (tanpa hairline border & tanpa `font-mono`).
- [x] **Task 9.4:** Boot sequence `./boot --portfolio` (< 2 detik, di-skip pada kunjungan ulang dalam sesi yang sama & saat reduced-motion).
- [x] **Task 9.5:** Halaman 404 bergaya `zsh: command not found`.

---

## Phase 10: Quality Assurance & Launch v1 (publik)
- [x] **Task 10.1:** Lakukan cross-browser & viewport test (Mobile 390px, Tablet 768px, Desktop 1440px).
- [x] **Task 10.2:** Jalankan audit aksesibilitas (keyboard focus `:focus-visible`, reduced-motion check).
- [x] **Task 10.3:** SEO: OpenGraph + `og:image`, Twitter card, JSON-LD `Person`, `sitemap.xml`, `robots.txt` (disallow `/admin`).
- [x] **Task 10.4:** Prerender `index.html` saat build agar konten tidak kosong untuk crawler.
- [x] **Task 10.5:** Performa: code-split CvModal/Terminal, `GithubGridBackground` hanya aktif di `(pointer: fine)` & pause saat offscreen, fallback CV untuk iOS.
- [x] **Task 10.6:** Jalankan `npm run build` + `npm run lint` dan pastikan zero warning/error.
- [ ] **Task 10.7:** Merge branch fitur ke `dev`, buat Pull Request ke `main`, dan deploy ke Vercel Edge.

---

## Phase 11: Backend — Supabase (Auth Google + Postgres + Storage)
> Arsitektur: admin menulis ke Supabase; situs publik **tetap statis** dan membaca snapshot konten saat build (lihat Phase 12). *(butuh approval dependensi `@supabase/supabase-js`)*
- [ ] **Task 11.1:** Setup project Supabase + Google OAuth client (Google Cloud Console): *(manual, ikuti [`docs/ADMIN.md`](./docs/ADMIN.md))*
  - Authorized origins: `http://localhost:5173`, `https://alfizdesta.com`, domain preview Vercel.
  - Redirect URI ke callback Supabase. Kredensial hanya di `.env` / Vercel env, contoh bersih di `.env.example`.
- [x] **Task 11.2:** Migrasi SQL di `supabase/migrations/`:
  - Tabel `profile` (singleton), `projects`, `badges`, `experiences`, `experience_photos`, `media`, `admins`, `publish_log`.
  - Kolom standar: `id`, `sort_order`, `status` (`draft`/`published`), `created_at`, `updated_at` (trigger).
- [x] **Task 11.3:** Row Level Security:
  - Write/read draft: hanya jika `auth.jwt() ->> 'email'` ada di tabel `admins` (allowlist di DB, bukan di client).
  - Read `published`: anon (dipakai build script).
- [x] **Task 11.4:** Storage bucket `media` (public read, admin write) untuk gambar proyek, badge, foto experience, dan CV.
- [x] **Task 11.5:** Seed script dari `src/data/` saat ini (setelah audit Task 5.4).

---

## Phase 12: Pipeline Publish (Build-time + Deploy Hook)
- [x] **Task 12.1:** `scripts/pull-content.ts` (dijalankan `prebuild`): ambil konten `published`, validasi dengan schema `zod`, tulis ke `src/data/generated/*.json`. Build gagal jika validasi gagal.
- [x] **Task 12.2:** Snapshot konten di-commit sebagai fallback → `npm run dev` & build tetap jalan tanpa Supabase.
- [x] **Task 12.3:** Vercel Function `/api/publish`: verifikasi JWT Supabase + cek allowlist admin → panggil Vercel Deploy Hook (URL hook di env server, tidak pernah di bundle client) → catat ke `publish_log`.
- [x] **Task 12.4:** Endpoint status deploy untuk ditampilkan di admin (queued → building → ready / error).

---

## Phase 13: Admin Dashboard UI (`/admin`)
- [x] **Task 13.1:** Login terminal `alfizdesta:~$ sudo login` + tombol "Continue with Google"; email non-admin → `sudo: user is not in the sudoers file. This incident will be reported.` Auth guard untuk semua route admin.
- [x] **Task 13.2:** Shell admin: sidebar pohon file VFS (`~/admin/projects`, `~/admin/badges`, `~/admin/experience`, `~/admin/profile`, `~/admin/media`), topbar status publish, command palette `⌘K`, responsif mobile.
- [x] **Task 13.3:** Overview: jumlah konten per koleksi, waktu publish terakhir, jumlah perubahan belum dipublish ("3 uncommitted changes").
- [x] **Task 13.4:** CRUD koleksi (Projects, Badges, Experience):
  - List dengan drag reorder (Framer Motion `Reorder`), filter draft/published.
  - Editor split: form (validasi `zod`) di kiri, **live preview memakai komponen publik asli** (drawer proyek, modal badge) di kanan.
  - Autosave draft + konfirmasi saat meninggalkan halaman dengan perubahan.
- [x] **Task 13.5:** Media manager: upload drag-drop, konversi otomatis ke `.webp` + resize di browser (canvas, tanpa dependensi), simpan `width`/`height`, `alt` wajib diisi.
- [x] **Task 13.6:** Profile & CV: toggle "Available for work", edit headline/bio/social links, upload CV dengan riwayat versi.
- [x] **Task 13.7:** Publish flow: tampilan diff ala `git diff` sejak publish terakhir → tombol Publish → progress deploy realtime.
- [x] **Task 13.8:** QA admin: keyboard navigation, focus-visible, empty/error/loading states, 390px & 1440px.
- [x] **Task 13.9:** Perbaiki layar putih saat mengisi Architecture overview sebelum Key decisions:
  - Preview tetap merender draft arsitektur yang belum lengkap; validasi simpan tetap berlaku.
  - Tes regresi render serta uji paste, pemulihan draft lokal, dan simulasi save di 390px/1440px; build dan lint lolos.
- [x] **Task 13.10:** Kelola logo navbar melalui Profile & CV:
  - Pilih/upload logo WebP melalui media picker, alt/dimensi tervalidasi, dan preview memakai komponen navbar yang sama.
  - Save profile → Publish memakai pipeline yang ada; profil lama tetap valid dan logo dihapus/gagal dimuat kembali ke AD.
  - Build/lint, tes schema/publish, dan browser 390px/1440px lolos: pilih library, upload PNG→WebP, preview, simulasi save/remove, fallback gambar rusak, focus-visible, dan tanpa overflow; tidak menulis konten produksi.
- [x] **Task 13.11:** Dukung logo navbar SVG:
  - Pilih/upload SVG asli melalui media picker; validasi SVG/WebP dan simpan MIME/dimensi SVG yang sesuai.
  - Schema/publish, upload/preview SVG di 390px/1440px (termasuk MIME kosong dan file asli/dimensi terjaga), regresi PNG→WebP, build, dan lint lolos; penyimpanan browser disimulasikan.

---

## Phase 14: V2 — Insight & Engagement
- [x] **Task 14.1:** Contact form → inbox admin (honeypot + rate limit di trigger DB). *Turnstile & notifikasi email: iterasi berikutnya.*
- [x] **Task 14.2:** Analytics ringan & privacy-friendly: CV dibuka/diunduh, drawer proyek dibuka, top 10 perintah terminal.
- [x] **Task 14.3:** Audit log perubahan konten (siapa, kapan, apa).
- [ ] **Task 14.4:** (Opsional) Konten bilingual ID/EN.
