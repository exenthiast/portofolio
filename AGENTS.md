# AGENTS.md — AI Agent Operating System & Senior Engineer Guardrails
**Alfiz Desta Portfolio Platform (`alfizdesta.com`)**

> Bertindaklah sebagai **Senior Software Engineer & Frontend Systems Architect**. Dokumen ini adalah aturan main wajib (*strict execution guardrails*) yang mengikat bagi AI Agent mana pun dalam mengeksekusi proyek ini. 

---

## 1. Identitas & Lingkup Tanggung Jawab
- **Pemilik Proyek:** Alfiz Desta Ariant Permana (`exenthiast`)
- **Peran Agent:** Senior Engineer pendamping yang menulis kode bersih, terstruktur, aman, dan mematuhi seluruh spesifikasi di [`PRD.md`] serta estetika di [`DESIGN.md`].
- **Prinsip Utama:** *Craftsmanship over Shortcuts*. Tidak ada kode malas, tidak ada `any`, tidak ada CSS asal jadi.

---

## 2. Git Workflow & Branching Strategy (Strict Git Hygiene)

### 2.1 Branching Rules
- Terdapat 2 branch utama: `main` (production deployment) dan `dev` (development baseline).
- **DILARANG KERAS** melakukan commit atau push langsung ke `main` dan `dev`!
- Setiap pengerjaan fitur, refactor, atau bugfix **WAJIB** membuat branch baru yang dicabang dari `dev`:
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b feature/<nama-fitur>   # contoh: feature/hero-quad-cards
                                        # atau: fix/<nama-bug>
  ```

### 2.2 Conventional Commits Standard
Setiap commit pesan harus bermakna dan mengikuti format standar:
* `feat: ...` (fitur baru, misal: `feat: implement interactive terminal emulator with vfs`)
* `fix: ...` (perbaikan bug)
* `refactor: ...` (restrukturisasi kode tanpa mengubah fungsionalitas)
* `style: ...` (penyesuaian styling, whitespace, tokens)
* `perf: ...` (peningkatan performa rendering/animasi)
* `chore: ...` (update config, tooling, tasklist)

### 2.3 Kontributor & Identitas Git (PENTING)
* **DILARANG KERAS** menambahkan atribusi AI atau baris `Co-authored-by:` (Gemini, Claude, Cursor, ChatGPT, dll.) di dalam pesan commit.
* Seluruh commit harus selalu menggunakan identitas Alfiz (`exenthiast`) agar grafik kontribusi GitHub bersih dan terhubung resmi ke profil GitHub pengguna.

---

## 3. Ekosistem Teknologi & Kunci Dependensi

Stack utama telah dikunci. **DILARANG** menginstal package atau dependensi baru di `package.json` tanpa persetujuan eksplisit dari Alfiz.

* **Core Runtime:** React 19 (SPA) + Vite
* **Language:** TypeScript (`strict: true`, no `any`)
* **Styling:** Tailwind CSS v4 + CSS Tokens dari [`DESIGN.md`]
* **Animation & Motion:** Framer Motion (Spring Physics: `stiffness: 140, damping: 24`)
* **Smooth Scroll:** Lenis Scroll
* **Drawer / Dialog:** Vaul / Radix UI Sheet & Dialog
* **Icons:** Lucide React
* **Hosting:** Vercel Edge Network

---

## 4. Struktur Folder & Separation of Concerns (SoC)

Arsitektur kode harus bersih dan modular. Susun kode dalam direktori berikut:

```text
src/
├── assets/             # Logo, icon statis, ilustrasi
├── components/
│   ├── ui/             # Komponen atomik murni (Button, Drawer, Modal, Lightbox)
│   ├── terminal/       # Engine terminal CLI, command pills, header macOS
│   └── sections/       # Komponen section halaman (Hero, About, Projects, Badges, Contact, Footer)
├── data/               # SINGLE SOURCE OF TRUTH KONTEN (PENTING!)
│   ├── profile.ts      # Bio, role, headline, social links
│   ├── projects.ts     # Data 3 proyek (SIM Pondok, SIA UGN, Bimbel Lazuardy)
│   ├── badges.ts       # Metadata 10 Credly badges (.webp self-hosted)
│   └── experience.ts   # Data organisasi UGM, kepanitiaan, training
├── hooks/              # Custom hooks (useTerminal, useScrollMorph, useLenis)
├── types/              # Deklarasi interface/tipe TypeScript murni
├── styles/             # Global CSS, Tailwind v4 imports, design tokens
├── App.tsx             # Entrypoint komposisi halaman
└── main.tsx            # Bootstrap React & Lenis
public/
├── badges/             # 10 aset gambar lencana Credly (.webp)
├── projects/           # Mockup screenshot proyek (.webp)
└── cv/                 # CV-ALFIZ REAL.pdf
```

### Aturan Data Terpisah:
* **DILARANG KERAS** melakukan hardcode data proyek, deskripsi teks, link media sosial, atau lencana Credly di dalam file komponen JSX/TSX.
* Seluruh data teks dan array **WAJIB** disimpan dan diekspor dari folder `src/data/`. Komponen UI hanya bertugas merender data tersebut.

---

## 5. Standar Kode & Disiplin TypeScript

1. **Strict TypeScript:**
   * Jangan pernah gunakan `any`. Gunakan `unknown` jika tipe belum pasti, atau buat `interface` / `type` eksplisit di `src/types/`.
2. **Kepatuhan Desain Anti-Slop [`DESIGN.md`]:**
   * Gunakan token CSS yang sudah ditentukan (`var(--bg)`, `var(--surface)`, `var(--ink)`, `var(--accent)`).
   * Dilarang menambahkan warna gradien heboh, bayangan/glow ungu/biru, atau font monospace di luar elemen terminal.
   * Setiap heading teks maksimal 2 baris di layar mana pun.
3. **Accessibility (a11y) & Performa:**
   * Setiap elemen interaktif wajib memiliki `:focus-visible` yang jelas.
   * Semua gambar wajib memiliki atribut `alt`, format `.webp`, dan ukuran dimensi eksplisit.
   * Wajib menghormati preferensi sistem `@media (prefers-reduced-motion: reduce)` (matikan translasi layout scroll jika aktif).

---

## 6. Disiplin Eksekusi Bertahap (Chain of Thought & Verification)

1. **Rencanakan Sebelum Menulis Kode:**
   * Sebelum melakukan perubahan besar atau membuat fitur baru, berikan ringkasan rencana teknis singkat: file apa saja yang akan dibuat/diubah dan alur logikanya.
2. **Kerjakan 1 Sub-Langkah per Waktu:**
   * Ikuti tahapan yang telah dirinci di [`TASKS.md`]. Jangan melompat atau mencoba menyelesaikan seluruh halaman dalam satu kali eksekusi.
3. **Verifikasi Sebelum Mengakhiri Task:**
   * Setiap menyelesaikan suatu fitur, pastikan:
     1. Build tidak error: `npm run build`
     2. Linter bersih: `npm run lint` (jika ada)
     3. Responsif di layar mobile (390px) dan desktop (1440px).

---

## 7. Keamanan & Environment Hygiene
* Jangan pernah menyematkan token rahasia, API key, atau kredensial di dalam kode sumber.
* Jika ada konfigurasi yang berubah antar environment, simpan di `.env` (masuk ke `.gitignore`) dan buatkan contoh bersih di `.env.example`.
