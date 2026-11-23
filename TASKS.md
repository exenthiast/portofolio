# TASKS.md — Engineering Roadmap & Step-by-Step Tasklist
**Alfiz Desta Portfolio Platform (`alfizdesta.dev`)**

> **Petunjuk Eksekusi Agent:** 
> - Kerjakan hanya **1 sub-task** dalam satu giliran.
> - Berikan ringkasan rencana file sebelum menulis kode.
> - Verifikasi dengan `npm run build` sebelum mencentang `[x]` pada task.

> **Urutan besar (disepakati):** Fondasi → Section publik → QA & Launch v1 → Backend Supabase → Pipeline publish → Admin Dashboard → V2.

> **Target rilis berikutnya (disepakati): v1.1.0.** v1.0.0 sudah dirilis. Phase 15 (keamanan Supabase) dan Phase 16 (peningkatan di bawah) menjadi satu target rilis, dikerjakan satu sub-task per giliran. Perubahan dapat ditinjau lewat PR terpisah; tidak perlu digabung menjadi satu PR besar. Siapkan backup dan bukti pemulihan (Task 16.1) sebelum menerapkan perubahan database Phase 15. Blog, bilingual ID/EN, dark mode, dan PWA tetap backlog opsional di luar target ini.

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
  - Target hosting diperbarui menjadi Cloudflare Workers; PR rilis `dev` → `main`: #10.
- [x] **Task 10.8:** Siapkan adapter Cloudflare Workers sebelum deployment:
  - Wrangler + Static Assets, routing `/admin/*` dan `/api/*`, serta header publik/admin.
  - Publish memakai validasi dan allowlist Supabase yang sama melalui Cloudflare Deploy Hook; adapter Vercel dipertahankan.
  - Status Cloudflare ditampilkan sebagai belum diketahui; hasil build diperiksa di dashboard, tanpa klaim sudah live.
  - Panduan build/runtime variables, preview, Google OAuth, dan domain Name.com ada di `docs/CLOUDFLARE.md`.
  - Build/lint, 27 tes, Wrangler dry-run, serta routing/header runtime lokal lolos; deployment dan OAuth live tetap tahap berikutnya.

---

## Phase 11: Backend — Supabase (Auth Google + Postgres + Storage)
> Arsitektur: admin menulis ke Supabase; situs publik **tetap statis** dan membaca snapshot konten saat build (lihat Phase 12). *(butuh approval dependensi `@supabase/supabase-js`)*
- [ ] **Task 11.1:** Setup project Supabase + Google OAuth client (Google Cloud Console): *(manual, ikuti [`docs/ADMIN.md`](./docs/ADMIN.md))*
  - Authorized origins: `http://localhost:5173`, `https://alfizdesta.dev`, domain preview Vercel.
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

---

## Phase 15: Perbaikan Keamanan Database Supabase
> Tindak lanjut pemeriksaan baca-saja production pada 22 November 2026. RLS aktif pada seluruh 10 tabel CMS; poin berikut mencatat risiko penyalahgunaan dan penguatan konfigurasi, bukan bukti kebocoran data. Status implementasi repository dan penerapan production dicatat terpisah; migrasi/pengaturan production di fase ini belum diubah. Checklist induk tetap terbuka bila masih memerlukan penerapan atau bukti aktif.

- [ ] **Task 15.1:** Lindungi input publik analytics dan kontak:
  - Tambahkan pembatasan permintaan dan validasi anti-bot di server; honeypot browser hanya menjadi pelengkap.
  - Tutup jalur insert langsung `anon`/pengguna biasa yang dapat melewati perlindungan server, sambil mempertahankan akses yang dibutuhkan admin.
  - Perbaiki pembatas kontak agar pergantian email tidak mudah menghabiskan kuota bersama dan menghalangi pengunjung sah.
  - [x] Implementasi repository: endpoint Worker kontak/analytics dengan Turnstile server-side, bukti analytics HMAC sementara, edge throttle, kuota atomik per sumber, serta migrasi `20261122040000_protect_public_input.sql` untuk menutup insert publik. Tes API/PostgreSQL lokal, build/lint, browser 390px/1440px (mock layanan eksternal), dan canary secret bundle lolos. Aktivasi widget/secrets, backup/restore, staging, dan penerapan production masih menunggu; urutan rollout ada di `docs/SECURITY.md`.
  - [x] Persiapan konfigurasi Cloudflare (konfirmasi Alfiz, 23 November 2026): site key build serta runtime Supabase/Turnstile/signing secret dan origin sudah diisi di dashboard. Nilai secret tidak dibaca atau dicatat. Pemeriksaan GET production masih menunjukkan `/api/contact` 404; pemeriksaan katalog database menunjukkan RPC rate limit/trigger timestamp belum tersedia dan policy insert publik lama masih ada. Konfigurasi ini belum membuktikan endpoint atau migrasi sudah aktif.
  - [x] Perbaikan check Workers Builds PR #13: tambahkan `previews.ratelimits` dengan namespace `151002`, terpisah dari production `151001`, untuk memenuhi konfigurasi `wrangler preview`. Parser konfigurasi Wrangler 4.166.0, bundling `deploy --dry-run`, build/lint, serta 11 tes Worker/input publik lolos; hasil check remote diverifikasi setelah push. Dependensi proyek tidak berubah.
- [ ] **Task 15.2:** Jadikan waktu analytics otoritatif dari server:
  - Tetapkan `events.created_at` di server/database dan cegah pemanggil publik menentukan waktunya sendiri.
  - Pertahankan validasi jenis event serta batas panjang label/path.
  - [x] Implementasi repository: migrasi `20261122010000_server_analytics_time.sql` menimpa timestamp insert/update; tes PostgreSQL lokal untuk timestamp palsu, jenis event, dan panjang label/path lolos, build/lint lolos. Penerapan dan pembuktian pada database aktif masih menunggu prasyarat backup/staging.
- [ ] **Task 15.3:** Cabut izin database yang tidak dibutuhkan aplikasi:
  - Hapus `TRUNCATE`, `TRIGGER`, dan `REFERENCES` dari role `anon` dan `authenticated` pada tabel CMS yang diperiksa; tinjau izin tambahan lain berdasarkan kebutuhan nyata.
  - Rapikan default privileges agar tabel baru tidak mewarisi izin berlebih, tanpa mengubah objek internal yang dikelola Supabase.
  - Pertahankan RLS dan izin minimum untuk konten publik, input yang telah dilindungi, serta operasi admin.
  - [x] Implementasi repository: migrasi `20261122020000_least_privilege_cms.sql` menetapkan grant CMS eksplisit dan default privileges; tes PostgreSQL lokal membuktikan pencabutan izin berlebih dan izin minimum tetap tersedia, build/lint lolos. Default milik `supabase_admin` hanya diubah bila role migrasi berwenang; jika tidak, perlu review pemilik sebelum checklist induk selesai. Belum diterapkan ke database aktif.
- [ ] **Task 15.4:** Rapikan keamanan fungsi database:
  - Kunci `search_path` pada `public.touch_updated_at()` dan gunakan referensi objek yang eksplisit bila diperlukan.
  - Tinjau/cabut izin `EXECUTE` yang tidak diperlukan pada fungsi trigger internal `guard_message_rate()` dan `write_audit()`, termasuk grant melalui `PUBLIC`.
  - Pertahankan akses `is_admin()` yang diperlukan policy dan backend; peringatan `SECURITY DEFINER` tidak otomatis berarti fungsi dapat dieksploitasi.
  - [x] Implementasi repository: migrasi `20261122030000_lock_internal_functions.sql` mengunci search path dan mencabut EXECUTE helper trigger, termasuk grant PUBLIC; tes PostgreSQL lokal membuktikan trigger audit/update tetap bekerja dan `is_admin()` tetap tersedia untuk RLS/backend, build/lint lolos. Belum diterapkan ke database aktif; advisor live masih mencerminkan konfigurasi lama.
- [x] **Task 15.5:** Tinjau pemisahan aset publik dan berkas privat:
  - Pertahankan bucket `media` untuk aset yang memang boleh diunduh publik; status draft konten tidak membuat file di bucket publik menjadi privat.
  - Jika ada kebutuhan berkas rahasia, gunakan bucket privat dengan policy admin dan akses sementara yang sesuai; jangan menganggap penyembunyian URL sebagai kontrol akses.
  - Bukti: inspeksi baca-saja bucket/policy aktif dan keputusan batas akses tercatat di `docs/SECURITY.md`; belum ada kebutuhan fitur berkas privat. Media manager dan picker menjelaskan unggahan langsung publik, termasuk draft. Build/lint serta browser 390px/1440px lolos dengan request eksternal disimulasikan; tidak mengubah bucket atau berkas production.
  - Tindak lanjut uji role lokal: migrasi `20261122050000_preserve_admin_storage_access.sql` menambahkan SELECT metadata bucket `media` khusus admin agar update/delete bekerja. Uji batas bucket dan penolakan pengguna biasa tersedia; penerapan policy ke production masih menunggu backup/staging.
- [ ] **Task 15.6:** Periksa konfigurasi Supabase Auth yang aktif:
  - Verifikasi provider login, pendaftaran akun, konfirmasi email, dan perlindungan akun admin; UI saat ini memakai Google OAuth.
  - Jika login password diaktifkan, evaluasi perlindungan password bocor sesuai dukungan paket Supabase; catat bila tidak relevan atau tidak tersedia.
  - [x] Pemeriksaan baca-saja aktif: Google dan Email aktif, signup terbuka, konfirmasi email wajib; satu admin memakai Google tanpa password tersimpan. Advisor menyatakan proteksi password bocor nonaktif. Rincian ada di `docs/SECURITY.md`; provider Email, dukungan paket, Google MFA/recovery, serta redirect allowlist masih memerlukan keputusan/verifikasi pemilik melalui dashboard sebelum checklist induk ditutup.
- [ ] **Task 15.7:** Verifikasi perbaikan sebelum menandai fase selesai:
  - Uji di lingkungan terisolasi/staging memakai data sintetis sebagai pengunjung, pengguna biasa, dan admin; jangan mengandalkan koneksi berhak istimewa untuk membuktikan RLS.
  - Buktikan data privat/draft dan operasi admin ditolak untuk pihak yang tidak berhak, sementara konten publik, pesan sah, analytics, serta alur publish tetap berfungsi.
  - Uji pembatasan permintaan, validasi anti-bot, penolakan jalur insert yang melewati server, dan penetapan waktu analytics; jangan melakukan uji spam pada production.
  - Jalankan ulang Security Advisor dan catat peringatan yang terselesaikan, dipertahankan dengan alasan, atau masih memerlukan validasi.
  - Untuk perubahan kode, jalankan `npm run build` dan `npm run lint`; bila UI berubah, verifikasi 390px/1440px. Catat hasil aktual sebelum mencentang task.
  - [x] Bukti repository/lokal: `node --test scripts/*.test.ts` lulus 42/42 tanpa skip, termasuk matriks RLS pengunjung/pengguna biasa/admin, Storage, publish log, timestamp, dan delapan request kontak bersamaan (hanya tiga lolos). Build/lint dan browser 390px/1440px dengan mock layanan eksternal lolos; warning ukuran chunk PDF lama tetap ada. Advisor production diperiksa ulang dan belum berubah karena migrasi belum diterapkan; rincian pengecualian dan gate penerapan ada di `docs/SECURITY.md`. Backup/restore, staging dengan layanan nyata, konfigurasi Auth, serta verifikasi sesudah penerapan masih terbuka.

---

## Phase 16: v1.1.0 — Kualitas Konten & Keandalan Operasional
> Status implementasi repository dan bukti operasional dicatat terpisah; checklist induk hanya ditutup setelah seluruh bukti task terpenuhi. Pertahankan arsitektur publik statis, sumber konten CMS yang ada, dan kompatibilitas fitur v1.0.0. Penambahan dependensi atau layanan baru yang memerlukannya tetap mengikuti persetujuan Alfiz; kredensial hanya di environment server.

- [ ] **Task 16.1:** Siapkan backup database dan media yang terbukti bisa dipulihkan:
  - Inventarisasi konten, schema/migrasi, dan file Storage yang perlu dicadangkan, termasuk CV, sertifikat, serta gambar; snapshot konten di Git bukan backup lengkap CMS.
  - Cadangkan file Storage secara terpisah karena backup database Supabase hanya menyertakan metadata file; tentukan lokasi salinan, jadwal, dan retensi sesuai kebutuhan.
  - Dokumentasikan dan uji pemulihan di lingkungan terisolasi; buktikan relasi konten dan file kembali berfungsi tanpa menimpa production.
  - [x] Persiapan repository (23 November 2026): `scripts/cms-backup.ts` untuk dump database/schema/roles tanpa password, salinan seluruh objek Storage dengan checksum, aset lokal/migrasi/snapshot, dan penolakan data berubah/referensi media hilang; `scripts/cms-restore-drill.ts` memulihkan hanya ke cluster PostgreSQL lokal baru dan membandingkan data serta pengiriman byte media. Panduan inventaris, lokasi salinan, jadwal/retensi, dan staging ada di [`docs/BACKUP.md`](./docs/BACKUP.md). Tidak menambah dependensi atau mengubah UI.
  - [x] Bukti lokal: `npm run build`, `npm run lint`, dan `node --test scripts/*.test.ts` lolos (46 tes, tanpa skip). Restore sintetis mempertahankan draft/published, inbox/audit/publish history, metadata Storage, serta 6 file public/private (WebP, PDF CV/sertifikat, SVG, dan file belum tertaut). Salinan rusak/tidak lengkap, unduhan gagal, dan perubahan data saat backup ditolak. Peringatan ukuran chunk PDF yang sudah ada tetap tercatat; tes ini tidak membuktikan Auth/Storage production atau QA browser staging.
  - [x] Prasyarat koneksi (23 November 2026): file password lokal berizin `600`, CA dari dashboard, dan koneksi session pooler dengan `verify-full` berhasil ke PostgreSQL 17.12. Transaksi baca-saja eksplisit terbukti aktif; query inventaris diperbaiki agar tidak bergantung pada `PGOPTIONS` yang tidak diterapkan pooler. Inventaris 10 tabel CMS/27 Auth/10 Storage, 50 objek/10.437.676 byte, serta 101 referensi URL media lolos; ekspor schema/role tanpa hash password berhasil sebagai artefak preflight privat. Build/lint dan 47 tes regresi lolos, termasuk penolakan tulis pada fixture lokal. Tidak mengubah data/config production; bukti ini belum merupakan backup data/file lengkap.
  - [ ] Bukti operasional: maintenance window belum diatur; belum ada arsip production lengkap, salinan terenkripsi kedua (dikonfirmasi Alfiz belum tersedia), aktivasi jadwal, atau restore Supabase staging dengan akses CV/PDF/Auth/Storage aktual. Task 16.1 dan gate penerapan Phase 15 tetap terbuka.
- [ ] **Task 16.2:** Selesaikan audit kebenaran konten bersama Alfiz (lanjutan Task 5.4):
  - Konfirmasi stack/versi, peran, tanggal, metadata kredensial, dan tautan demo/repository; tandai klaim yang belum memiliki bukti untuk dikonfirmasi atau diperbaiki.
  - Seragamkan konten publik ke bahasa yang disepakati; bilingual tetap Task 14.4, bukan prasyarat rilis ini.
  - Perbarui melalui sumber konten yang ada dan verifikasi snapshot publik setelah publish; jangan mengarang angka dampak atau menaruh konten di komponen.
- [ ] **Task 16.3:** Perdalam studi kasus setiap proyek yang dipublikasikan:
  - Jelaskan masalah, kontribusi pribadi dan batas peran tim, keputusan teknis beserta alasannya, bukti implementasi, serta hasil yang bisa diverifikasi.
  - Kaitkan klaim teknis dengan repository, screenshot, diagram, atau pengujian yang relevan; gunakan hasil fungsional jika belum ada metrik terukur.
  - Pakai field CMS yang sudah tersedia terlebih dahulu; perluasan schema hanya jika konten membutuhkannya, dengan kompatibilitas data lama dan preview admin.
- [ ] **Task 16.4:** Sediakan halaman proyek dengan URL tersendiri:
  - Sajikan studi kasus dari sumber konten yang sama pada path publik per slug, dengan HTML hasil prerender, judul, canonical, serta metadata OpenGraph khusus proyek.
  - Pertahankan drawer dan deep link lama `/#projects/<slug>`; verifikasi akses langsung, refresh, tombol back, slug tidak dikenal, dan routing Cloudflare.
  - Tambahkan URL proyek ke sitemap; uji preview tautan serta tampilan 390px/1440px, navigasi keyboard, dan reduced motion.
- [ ] **Task 16.5:** Lengkapi kepastian hasil publish Cloudflare:
  - Hubungkan permintaan publish dengan build/deployment yang sesuai; tampilkan queued/building/ready/error, tautan log, dan kondisi timeout/unknown dengan jujur.
  - Bedakan snapshot yang diminta untuk dipublish dari konten yang terbukti sudah aktif; tampilkan identitas versi konten aktif dan jangan menandai perubahan sudah tayang hanya karena deploy hook menerima request.
  - Verifikasi build gagal, request berulang, dan perubahan konten saat build berlangsung; dokumentasikan pemulihan deployment beserta snapshot kontennya, karena rollback Worker tidak memulihkan database/media.
- [ ] **Task 16.6:** Tambahkan notifikasi email untuk pesan masuk (lanjutan Task 14.1):
  - Kirim pemberitahuan kepada Alfiz setelah pesan berhasil tersimpan melalui jalur server yang dilindungi pada Task 15.1; gunakan penyedia email yang disepakati sebelum integrasi.
  - Kegagalan email tidak boleh menghilangkan pesan atau membuat pengunjung mengirim ulang pesan yang sudah tersimpan; catat status pengiriman dan sediakan retry terbatas tanpa notifikasi ganda.
  - Uji pesan tersimpan, notifikasi berhasil/gagal, dan balasan melalui email menggunakan data sintetis serta penerima uji yang disepakati.
- [ ] **Task 16.7:** Otomatiskan pemeriksaan kualitas pada setiap PR:
  - Tambahkan workflow GitHub Actions untuk build, lint, dan seluruh tes yang tersedia, memakai versi Node yang sesuai deployment dan snapshot fallback tanpa kredensial production.
  - Tambahkan pemeriksaan alur penting secara bertahap: buka studi kasus/deep link, akses CV, navigasi admin, dan hasil publish memakai simulasi atau staging.
  - Verifikasi workflow benar-benar berjalan dan kegagalan pemeriksaan terlihat sebelum merge; jangan melakukan publish atau menulis ke database production dari CI.
- [ ] **Task 16.8:** Catat baseline performa dan periksa regresi pengalaman pengguna:
  - Ukur production pada mobile/desktop untuk loading, respons interaksi, dan kestabilan layout (LCP, INP, CLS); bedakan data pengguna nyata dari hasil pengujian lab, dan catat jika data lapangan belum cukup.
  - Tentukan optimasi berdasarkan temuan terukur pada aset, bundle, atau animasi; simpan hasil sebelum/sesudah dengan kondisi pengukuran yang sama.
  - Verifikasi viewport 390px/1440px, navigasi keyboard, fokus modal/drawer, reduced motion, serta akses CV/PDF pada browser mobile.
- [ ] **Task 16.9:** Selaraskan dokumentasi dan metadata rilis:
  - Rekonsiliasi status Task 10.7/11.1 dengan bukti deployment dan OAuth aktual; perbarui panduan hosting utama ke Cloudflare Workers dan jelaskan posisi adapter Vercel.
  - Selaraskan versi `package.json` dan lockfile ke target v1.1.0 saat rilis siap; catat perubahan dari v1.0.0, konfigurasi baru, migrasi, dan langkah pemulihan.
  - Pastikan contoh environment bersih dan panduan setup/publish bisa diikuti tanpa kredensial yang tertanam di repository.
- [ ] **Task 16.10:** Ganti favicon portfolio agar konsisten dengan logo navbar:
  - Gunakan aset logo navbar dari sumber konten profil (`navbarLogo`) yang sama; sediakan fallback inisial AD jika logo belum diatur atau tidak dapat digunakan sebagai favicon.
  - Pastikan ikon tetap terbaca pada ukuran 16px/32px dengan rasio dan ruang aman yang sesuai, tanpa mendistorsi atau mengubah aset logo navbar asli.
  - Perbarui referensi favicon publik/admin melalui alur snapshot/build/publish yang ada; tangani cache agar favicon baru dapat terlihat setelah perubahan logo dipublish.
  - Verifikasi favicon di browser desktop/mobile, fallback, dan akses langsung `/admin`; jalankan build/lint serta pastikan tidak ada request aset ikon yang gagal.
- [ ] **Task 16.11:** Verifikasi dan rilis satu paket v1.1.0:
  - Pastikan Phase 15 dan Task 16.1–16.10 selesai dengan bukti aktual; jalankan build, lint, tes relevan, serta QA publik/admin pada 390px/1440px.
  - Verifikasi alur simpan → publish → deployment berhasil → konten publik sesuai, pesan masuk/notifikasi, analytics, halaman proyek, dan akses media; catat hasil pemeriksaan staging serta pemeriksaan production yang aman.
  - Ikuti alur PR branch fitur → `dev` → `main`, buat release/tag v1.1.0 sesuai hasil yang sudah diverifikasi, dan catat deployment serta versi konten yang aktif.
