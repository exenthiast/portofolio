# Audit kebenaran konten — Task 16.2

Audit awal: **24 November 2026 WIB**. Status: **bahasa EN/ID dan koreksi
JavaScript disetujui; implementasi bilingual lokal tersedia, koreksi CMS,
QA browser dan publish masih pending**.
Task 5.4/16.2 belum selesai; Task 16.3 belum dimulai.

## Cakupan dan identitas sumber

Audit membandingkan konten published dengan snapshot repository, CV yang sudah
publik, repository proyek, halaman verifikasi Credly, serta sertifikat yang
ditautkan dari CMS. PRD/DESIGN adalah spesifikasi produk, bukan bukti independen
atas riwayat pribadi atau implementasi proyek lain.

- Baseline awal audit: `dev` pada
  `3a1ecf5db177e9f2dde0dcd2877bf297e849df8c`.
  [PR #14](https://github.com/exenthiast/portofolio/pull/14) terverifikasi merged
  ke `dev` pada **23 November 2026 18:45:31 UTC** (24 November 01:45:31 WIB),
  merge commit `ddc7ab7ac60b0c7842ff57ef3981d7ca42f57c0b`.
  Setelah `git fetch origin`, branch yang sama, `feature/content-truth-audit`,
  di-fast-forward ke commit tersebut; tidak membuat branch atau commit baru.
  Perubahan audit diamankan melalui salinan lokal dan stash tiga path eksplisit,
  lalu dipulihkan memakai `stash apply` tanpa menghapus stash pengaman.
  Sebelum pembaruan dokumen ini, hash dokumen audit dan `.gitignore` cocok dengan
  salinan pengaman; `TASKS.md` memuat catatan audit lama dan seluruh isi upstream.
  Tidak ada konflik. Aturan ignore `backups/`, `*.dump`, dan `*.backup` kini
  berasal dari PR #14; arsip/password/config privat tetap ignored dan tidak tracked.
  Bukti Task 16.1, konfirmasi FileVault On, penguatan tambahan, dan batasan
  staging di `docs/BACKUP.md`, `docs/SECURITY.md`, dan `TASKS.md` dipertahankan.
- Snapshot: [`src/data/generated/content.json`](../src/data/generated/content.json),
  terakhir diubah oleh commit `91a0dde`. SHA-256 byte file:
  `d7f8e55e5eb9e1b40d778221888eec81682d6bbd7b1a41f6a31d5175a4319ba7`.
- Pembacaan CMS melalui `fetchPublishedContent` pada
  `2026-11-23T18:16:31.544Z` (24 November WIB) **sama persis secara JSON**
  dengan snapshot: **4 proyek, 10 badge, 6 sertifikat, 10 pengalaman**.
  SHA-256 `JSON.stringify(content)` keduanya:
  `1fb16280ad01e12b94a2cb9d082e0f8c4a5474b7f1f5f4899018e47325984a28`.
- [Halaman production](https://alfizdesta.dev/) merespons HTTP 200; judul dan
  deskripsi keempat proyek ditemukan dalam HTML prerender. SHA-256 HTML:
  `a46710ae0563b5cf704a15f598a59b3ab72c4e0fd4b76bcb63d315053efbfc6f`.
  Ini memeriksa sebagian konten aktif, belum membuktikan seluruh data dalam
  bundle/browser atau identitas deployment setelah publish baru.
- CV: [`public/cv/alfiz-desta-cv.pdf`](../public/cv/alfiz-desta-cv.pdf).
  CV adalah pernyataan pemilik yang berguna sebagai pembanding, bukan bukti
  terpisah untuk performa, jabatan lead, atau versi runtime.
- Pemeriksaan HTTP dilakukan sekitar `2026-11-23T18:18:24.787Z`; halaman Credly
  publik diperiksa sampai `2026-11-23T18:19:22.338Z` (keduanya 24 November WIB).
  Ketersediaan tautan dapat berubah setelah pemeriksaan.

Tidak ada save/publish CMS, upload, migrasi, atau perubahan layanan production
dalam audit ini. Tidak membaca dump Auth, inbox, atau kredensial backup untuk
menentukan fakta publik. Hasil HTTP/ekstraksi sementara berada di `/tmp`, bukan
arsip bukti permanen; URL, commit, dan hash di sini menjadi rujukan pemeriksaan.

## Proyek: bukti dan pertanyaan

### SIM Pondok Tahfidz (`sim-pondok-tahfidz`)

Sumber: [repository pada commit yang diperiksa][sim-root],
[README][sim-readme], [arsitektur][sim-architecture], [DBML][sim-db],
[cuplikan service][sim-service], dan CV.

- **Didukung dokumentasi/CV:** PHP 8.3, Laravel 13, PostgreSQL, Sanctum,
  DomPDF, Docker dan PHPUnit. Repository publik berupa showcase dokumentasi,
  spesifikasi, dan cuplikan, tanpa `composer.json`/lockfile aplikasi. Versi patch,
  instalasi aktual, dan konfigurasi runtime belum dibuktikan.
- **Didukung cuplikan:** pengecekan santri binaan, eager loading relasi,
  transaksi penyimpanan setoran, serta pembuatan PDF. DBML mendokumentasikan
  normalisasi master surat dan batas unik sesi/presensi; penerapannya dalam
  database aktif belum diuji dalam audit ini.
- **Belum didukung sumber yang diperiksa:** pola service-repository,
  isolasi tenant, rubric JSONB, pencatatan keuangan syariah, dan pelaporan wali
  santri secara real-time. Redis disebut di README; konfigurasi aktif belum ada
  dalam bukti yang diperiksa. Konfirmasi atau persempit copy ke fitur terbukti.
- **Peran:** CMS menyebut `Lead Backend Developer`; CV dan README menyebut
  Backend Developer/Engineer. Alfiz perlu menjelaskan mandat lead, modul milik
  pribadi, pekerjaan tim, dan periode kontribusi. Jangan mengambil angka tes,
  latensi, throughput atau peningkatan dari README tanpa laporan uji aktual.
  CV mencantumkan Agt–Des 2026; pada saat audit November 2026, konfirmasi
  apakah Desember adalah rencana akhir pekerjaan yang masih berjalan.
- [Demo](https://simpondokk.vercel.app/) HTTP 200, judul `SIMPONDOK Tahfidz`.
  Belum menguji login, API, atau hubungan deployment dengan commit showcase.

### Katalog Pustaka (`katalog-pustaka`)

Sumber: [repository][catalog-root], [Composer][catalog-composer],
[lockfile][catalog-lock], [Dockerfile][catalog-docker],
[Compose][catalog-compose], [manifest frontend][catalog-frontend],
[routes API][catalog-routes], [workflow][catalog-ci].

- **Didukung konfigurasi/source:** Laravel 13, Vue 3, Sanctum, PostgreSQL 16,
  Docker/FrankenPHP, GitHub Actions, PHPUnit, Prometheus dan Grafana.
  Composer meminta PHP `^8.3`; Dockerfile dan CI menetapkan PHP 8.4, sehingga
  label PHP 8.4 didukung konfigurasi proyek ini.
- Lockfile mencatat Laravel **v13.37.0**, Sanctum **v4.3.3**, PHPUnit
  **12.5.40**. Bedakan versi terkunci ini dari rentang manifest dan runtime live.
- Routes melindungi pengelolaan buku dengan Sanctum; Compose menetapkan volume
  database; workflow mengatur tes/build sebelum publikasi image bertag commit.
  Ini membuktikan implementasi konfigurasi, bukan keberhasilan setiap run,
  image yang telah terbit, atau monitoring di production.
- **Konfirmasi Alfiz:** proyek individual atau tim, bagian yang dikerjakan
  sendiri, nama mata kuliah dan periode kontribusi. Tidak ada demo di CMS;
  jangan membuat URL demo atau angka dampak baru.

### SIA UGN (`sia-ugn`)

Sumber: [repository][sia-root], [README][sia-readme],
[arsitektur][sia-architecture], [GpsService][sia-gps],
[dokumentasi pipeline][sia-pipeline], dan CV.

- **Didukung dokumentasi:** Laravel 12, MySQL, Sanctum, Haversine geofencing,
  FCM, Docker/GHCR/Railway. Cuplikan GPS menunjukkan kalkulasi Haversine dan
  iterasi koleksi kampus. Repository adalah showcase tanpa manifest aplikasi;
  workflow Docker diberi nama `docker-build-push.example.yml`. Implementasi
  deployment aktif belum dibuktikan oleh keberadaan contoh tersebut.
- **Bertentangan antar sumber:** CMS/README menyebut PHP **8.2**, CV **8.3**.
  Jangan memilih berdasarkan asumsi; minta manifest/lockfile atau konfirmasi.
  Diagram README juga menyebut PostgreSQL/MySQL, sedangkan tabel stack dan CV
  menyebut MySQL. Pertahankan perbedaan antara diagram generik dan DB aktual.
- **Belum didukung sumber yang diperiksa:** kemampuan concurrency tinggi,
  KRS dengan optimistic locking, penjadwalan ruang otomatis, transkrip
  terenkripsi, cache silabus/jadwal, dan pipeline agregasi IPK. Bukti yang ada
  lebih banyak menjelaskan presensi dosen, BKD/PAK, Tridharma dan payroll.
- **Peran:** Backend Developer di CV vs `Backend Systems Engineer` di CMS.
  Konfirmasi label publik dan pembagian modul pribadi/tim. Angka benchmark
  dalam README belum diverifikasi dengan hasil pengukuran.
- [Demo](https://sia.trisuladana.com): fetch gagal; pemeriksaan ulang mencatat
  DNS `ENOTFOUND` dari lingkungan pemeriksaan. Status layanan secara umum
  belum dapat disimpulkan. Konfirmasi domain aktif dan apakah demo boleh publik.

### Bimbel Lazuardy (`bimbel-lazuardy`)

Sumber: [repository][lazuardy-root], [package.json][lazuardy-package],
[router][lazuardy-router], [store registrasi][lazuardy-store], dan CV.

- **Didukung manifest:** Vue `^3.3.4`, Pinia `^3.0.3`, Vite `^4.4.5`,
  Tailwind `^3.3.2`. Ini rentang dependency, bukan versi instalasi yang
  dikonfirmasi. Jangan menggunakan versi stack portfolio untuk proyek ini.
- **Perlu koreksi/konfirmasi:** CMS mencantumkan TypeScript; manifest yang
  diperiksa tidak memuat TypeScript dan tree tidak memiliki file `.ts`/`.tsx`.
  Source yang ditinjau menggunakan JavaScript dan Vue SFC.
- Router/source dan CV mendukung registrasi siswa/tutor, katalog tutor,
  penjadwalan, checkout/pembayaran, serta percakapan. Store yang diperiksa
  menyimpan formulir registrasi; ini bukan bukti hidrasi sesi latihan siswa.
- **Belum didukung sumber yang diperiksa:** simulasi tryout dengan timer dan
  deteksi perpindahan tab, analisis butir soal, grafik penguasaan materi,
  chart SVG tanpa dependency, dan state sesi latihan. Konfirmasi sumber/branch
  lain atau ganti copy dengan alur tutoring yang didukung bukti.
- **Peran:** CMS/About memakai Lead/led Frontend; CV hanya Frontend Developer.
  Konfirmasi mandat lead dan pemisahan tanggung jawab frontend vs backend tim.
- [Demo](https://lazuardy.trpl.space) HTTP 200, judul `project-lazuardy`.
  Login, pembayaran, dan fungsi backend tidak diuji.

## Organisasi, kepanitiaan, dan tanggal

Foto/logo membuktikan keberadaan aset; tidak otomatis membuktikan jabatan,
durasi, skala acara, atau kepemilikan kontribusi.

| ID CMS | Perbandingan bukti | Tindak lanjut |
| --- | --- | --- |
| `exp-kmtedi` | CMS memperluas KMTEDI menjadi Keluarga Mahasiswa Teknologi Rekayasa Perangkat Lunak. CV serta PDF TED/TGES menyebut **Keluarga Mahasiswa Teknik Elektro dan Informatika**. CV mulai Okt 2024, CMS hanya 2024–Sekarang. | Koreksi nama sesuai dokumen; konfirmasi bulan mulai dan keanggotaan saat ini. Deskripsi workshop/leadership perlu dikonfirmasi terhadap tugas divisi. |
| `exp-bklass` | CV mendukung Divisi Minat dan Bakat, Okt 2024–Okt 2025, komunitas mahasiswa asal Klaten. CMS mendeskripsikan komunitas lintas prodi secara umum. | Konfirmasi nama panjang resmi dan persempit deskripsi ke komunitas/kontribusi sebenarnya. |
| `exp-b07771` | CV mendukung Koordinator Logistik TGES, Jun 2026. | Didukung CV; konfirmasi periode persiapan/pelaksanaan bila perlu lebih presisi. |
| `exp-ted` | CV mendukung staf keamanan, Okt–Des 2025. PDF mendukung peran staf keamanan dan tahun 2025; diterbitkan 25 Desember 2025. | Peran didukung dokumen. Bedakan tanggal terbit sertifikat dari periode kerja; rincian protokol/national-scale masih perlu bukti. |
| `exp-trpl-league` | CV mendukung subkoordinator keamanan Liga TRPL, Nov 2025. | Didukung CV; konfirmasi rincian acara dan tugas tim. |
| `exp-tges` | PDF mendukung Subkoordinator Logistik dan Konsumsi TGES, acara **3–30 Mei 2025**. Sertifikat diterbitkan **1 Oktober 2025**. | Peran dan bulan acara cocok; jangan memakai tanggal acara sebagai tanggal terbit credential. |
| `exp-blastout` | CMS/CV hanya Des 2024. PDF BLASTOUT 2025 menyebut acara **26 Januari dan 2 Februari 2025**, terbit **2 Februari 2025**, peran staf Humas, Publikasi, dan Akotrans. | Konfirmasi apakah Des 2024 adalah awal persiapan; tentukan rentang kontribusi tanpa menyamakan masa persiapan dengan tanggal acara. |
| `exp-722fc3` | Liga TRPL 2024: CMS **Nov 2024**, CV **Okt 2024**. | Konfirmasi tanggal; PDF dengan nama file Liga TRPL ternyata sertifikat orientasi, sehingga tidak menyelesaikan perbedaan ini. |
| `exp-gc-arcade` | CV mendukung peserta Dicoding/Google Cloud, Jul–Sep 2026. Badge mendukung penerbit Google Cloud, belum otomatis membuktikan semua lab Kubernetes/Terraform/BigQuery pada deskripsi training. | Konfirmasi program, periode, dan cakupan aktivitas. |
| `exp-injourney` | CV mendukung peserta InJourney Hospitality House, Jun 2026. | Konfirmasi penulisan resmi dan lingkup pelatihan; jangan menambah klaim kepemimpinan di luar bukti. |

## Badge Credly

Seluruh 10 halaman `/badges/<credentialId>/public_url` merespons HTTP 200.
Metadata publik mencocokkan **judul, Google Cloud sebagai penerbit, dan Alfiz
Desta sebagai penerima**. UUID URL cocok dengan `credentialId` CMS. Tanggal
terbit/berakhir tidak ditemukan dalam metadata HTML yang diperiksa; tanggal
berikut masih nilai CMS, belum verifikasi tanggal oleh penerbit.

| ID | Judul ringkas | Tanggal CMS | Halaman verifikasi publik |
| --- | --- | --- | --- |
| `badge-10` | Build Real World AI Applications with Gemini and Imagen | Aug 24, 2026 | [Credly](https://www.credly.com/badges/81532c52-82c0-4fb3-a727-8d2ac746da7b/public_url) |
| `badge-1` | Implement CI/CD Pipelines on Google Cloud | Aug 18, 2026 | [Credly](https://www.credly.com/badges/d383138a-541f-4145-bf38-65842bdc65aa/public_url) |
| `badge-2` | Manage Kubernetes in Google Cloud | Aug 4, 2026 | [Credly](https://www.credly.com/badges/53067b9a-611f-49c5-9aec-75a1c5ee06db/public_url) |
| `badge-8` | Connecting Cloud Networks with NCC | Aug 3, 2026 | [Credly](https://www.credly.com/badges/afa699e6-67f7-409a-94f9-b9407e728f6f/public_url) |
| `badge-5` | Deploy Multi-Agent Architectures | Aug 2, 2026 | [Credly](https://www.credly.com/badges/c43130be-6ff0-46b6-9d0f-3c53e22cb76d/public_url) |
| `badge-3` | Orchestrate Multi-agent Workflows with Gemini Enterprise | Jul 28, 2026 | [Credly](https://www.credly.com/badges/054d6bd4-9844-46d8-ac73-432bf4d1fb44/public_url) |
| `badge-4` | Engineer AI Agents with Agent Development Kit (ADK) | Jul 26, 2026 | [Credly](https://www.credly.com/badges/7199c1b7-aa99-4afe-b537-df6f4f65e53a/public_url) |
| `badge-7` | Build a Data Warehouse with BigQuery | Jul 25, 2026 | [Credly](https://www.credly.com/badges/873aea22-5f6a-4979-b55e-aa023d211a92/public_url) |
| `badge-6` | Secure Software Delivery | Jul 23, 2026 | [Credly](https://www.credly.com/badges/f6598bae-0c88-41bd-aecc-f87f0e28021a/public_url) |
| `badge-9` | Build Infrastructure with Terraform on Google Cloud | Jul 23, 2026 | [Credly](https://www.credly.com/badges/5b0509ee-66ca-48cd-9807-8779bd7b3041/public_url) |

CMS masih memakai `/earner/earned/badge/<id>`. Semua merespons HTTP 200 tetapi
hanya judul HTML generik `Credly`; respons tersebut tidak cukup sebagai bukti
verifikasi penerima. Gunakan tautan publik di tabel saat koreksi CMS. URL profil
`https://www.credly.com/users/alfiz-desta` di `src/data/credentials.ts` belum
diverifikasi sebagai profil yang benar; minta konfirmasi URL berbagi Alfiz.

Deskripsi ADK yang tampak membahas pelatihan model ternyata **sama dengan metadata
penerbit saat diperiksa**; jangan menggantinya dengan karangan berdasarkan judul.
Keterampilan/typo seperti `Kubetcl` dan `Infrastucture` perlu dicocokkan dengan
metadata resmi sebelum normalisasi. Ketiadaan `expiryDate` belum menjadi bukti
tidak kedaluwarsa; UI saat ini menampilkan `No expiry` untuk nilai kosong.

## Sertifikat

Kelima PDF tertaut berhasil diunduh HTTP 200 dengan MIME `application/pdf` dan
teks dapat dibaca. Gambar Huawei juga dibaca secara visual. Kecocokan dokumen
tidak sama dengan pemeriksaan pencabutan/validitas ke layanan penerbit.

| ID CMS | Hasil pembandingan | Koreksi/konfirmasi |
| --- | --- | --- |
| `credential-a5b886` | Gambar [Huawei][huawei-image]: **HCIA-AI V4.0 Course**, Certificate of Completion, **2026-07-07**, kode **ICT20260707008507** cocok. | Judul CMS terlalu umum dan tanggal hanya 2026. Dokumen menjelaskan penyelesaian course, bukan kelulusan ujian sertifikasi Huawei; pertahankan perbedaan ini. |
| `credential-fd38dc` | [PDF TED][ted-pdf]: **4141/UN1/SV2-TEDI/KM/SR/2025**, terbit **25 Desember 2025**, penerima dan peran cocok. | CMS memakai **4141/UNI/SV-2-TEDI/KM/SR/2025**; perbaiki nomor berdasarkan dokumen, lengkapi tanggal terbit. |
| `credential-95fc10` | [PDF TGES][tges-pdf]: nomor **397/MT-01/STF/KMTEDI-UGM/2025** cocok; terbit **1 Oktober 2025**; kegiatan Mei 2025. | CMS hanya menyimpan tahun; dapat dilengkapi tanpa mengubah tanggal kegiatan. |
| `credential-2aec78` | [PDF BLASTOUT][blastout-pdf]: nomor **255/B/SEK/Bklass/I/2025** cocok; terbit **2 Februari 2025**. | Lengkapi tanggal; rekonsiliasi periode pengalaman seperti di atas. |
| `credential-3d0bdb` | [PDF orientasi][orientation-pdf] menyebut peserta **Software Engineering Oriented Study 2024**, kegiatan **8 September 2024**, ASSETS UGM. | Judul CMS orientasi didukung dokumen, tetapi nama file/alt masih Liga TRPL. Perbaiki alt melalui CMS; jangan menganggapnya sertifikat kepanitiaan Liga TRPL atau menyimpulkan tanggal terbit dari tanggal kegiatan. |
| `credential-a96c01` | [PDF PIONIR][pionir-pdf] mendukung penerima, program studi, kelulusan peserta dan kegiatan **29 Juli–3 Agustus 2024**. | Tahun 2024 didukung; tanggal terbit lengkap tidak tercetak pada teks yang terbaca. Jangan mengarang tanggal atau credential ID. |

Semua sertifikat belum memiliki `verificationUrl`; ini field opsional, bukan
alasan membuat tautan baru. Konfirmasi status kedaluwarsa per credential bila
label `No expiry` ingin dipertahankan sebagai klaim.

## Bahasa publik dan konfirmasi pemilik

Pada audit awal, bahasa belum disepakati. Profil/navigasi dominan Inggris, tetapi
deskripsi SIM, beberapa fitur, role organisasi, bulan `Okt`/`Des`, kata
`Sekarang`, deskripsi Arcade, serta judul/alt sertifikat masih campuran.
Nama resmi organisasi/proyek/credential dapat dipertahankan dalam bahasa asal.
Pemilik kemudian memilih tombol EN/ID untuk seluruh halaman; CV dikecualikan
dari penerjemahan dan dikelola sebagai dua file terpisah. Implementasi bilingual
dicatat di Task 14.4 atas permintaan eksplisit ini.

Koreksi berikut sudah memiliki rujukan dokumen dalam audit. Daftar ini disiapkan
untuk review sebelum penyuntingan CMS; belum diterapkan:

- Nama panjang KMTEDI sesuai PDF TED/TGES dan CV: **Keluarga Mahasiswa Teknik
  Elektro dan Informatika**.
- Huawei: judul **HCIA-AI V4.0 Course**, terbit **7 Juli 2026**; jenis bukti
  tetap penyelesaian course, bukan kelulusan ujian sertifikasi Huawei.
- TED: nomor **4141/UN1/SV2-TEDI/KM/SR/2025**, terbit **25 Desember 2025**.
- TGES 2025: tanggal terbit sertifikat **1 Oktober 2025**, terpisah dari
  kegiatan **3–30 Mei 2025**.
- BLASTOUT 2025: tanggal terbit **2 Februari 2025**; periode kontribusi masih
  membutuhkan konfirmasi di bawah.
- Sertifikat orientasi ASSETS: alt yang masih menyebut Liga TRPL perlu
  disesuaikan dengan dokumen **Software Engineering Oriented Study 2024**.
- Sepuluh link verifikasi badge dapat diarahkan ke halaman publik yang telah
  diperiksa pada tabel Credly; ini tidak memverifikasi tanggal atau expiry.

Pertanyaan pada audit awal (jawaban terbaru tercatat pada bagian berikut):

| ID | Pertanyaan | Jawaban yang diperlukan |
| --- | --- | --- |
| F1 | Bahasa publik English atau Indonesia? Apakah penyeragaman mencakup CV? | Pilih bahasa dan cakupan CV; nama resmi proyek/organisasi/credential dapat tetap sesuai sumber. |
| F2 | Apa kontribusi pribadi dan pekerjaan anggota tim pada keempat proyek? Apakah gelar Lead untuk SIM Pondok/Lazuardy tepat, dan label Backend Systems Engineer untuk SIA sesuai? | Per proyek: label peran, modul pribadi, bagian tim, serta periode kontribusi. Untuk SIM, konfirmasi apakah Desember 2026 di CV adalah rencana akhir pekerjaan yang masih berjalan. Untuk Katalog, konfirmasi individual/tim dan nama mata kuliah. |
| F3 | PHP SIA aktual 8.2 atau 8.3? Apakah Lazuardy memakai TypeScript pada branch/repository lain? | Versi runtime/manifest yang berlaku, atau sumber yang dapat diperiksa. Source publik Lazuardy yang diperiksa menggunakan JavaScript/Vue. |
| F4 | Apakah klaim teknis yang belum didukung memang diimplementasikan? | SIM: service-repository, tenant, JSONB, Redis aktif, keuangan syariah/pelaporan wali real-time. SIA: concurrency/KRS locking, jadwal ruang otomatis, transkrip terenkripsi, cache silabus/jadwal dan agregasi IPK. Lazuardy: tryout, timer/anti-cheat, analisis soal/grafik, SVG chart dan sesi latihan. Berikan sumber per klaim atau pilih menghapus/mempersempitnya ke fitur yang telah didukung; jangan mengisi angka performa tanpa hasil uji. |
| F5 | Apa periode yang benar untuk Liga TRPL 2024 dan BLASTOUT 2025? Apakah keanggotaan KMTEDI masih aktif? | Liga TRPL: Oktober di CV vs November di CMS. BLASTOUT: apakah Desember 2024 awal persiapan, dan kapan kontribusi berakhir terhadap acara Januari–Februari 2025? KMTEDI: konfirmasi mulai Oktober 2024 dan status saat ini; nama panjang sudah didukung dokumen di atas. |
| F6 | Apakah `https://sia.trisuladana.com` masih demo yang berlaku dan boleh ditautkan publik? | URL aktif atau keputusan menyembunyikan demo yang belum dapat diverifikasi. Dua demo lain hanya terbukti merespons HTTP 200 pada audit awal, belum diuji fungsional/login. |
| F7 | Apa URL profil Credly berbagi yang benar dan tanggal terbit/expiry masing-masing badge? | Rujukan metadata/konfirmasi per ID badge pada tabel; tanpa bukti, jangan menganggap expiry kosong sebagai tidak kedaluwarsa. Status expiry sertifikat serta tanggal/ID yang belum tercetak juga tidak boleh diisi dengan tebakan. |
| F8 | Apakah role profil, basis lokasi Yogyakarta, status Available for work, dan rincian organisasi/training yang dicatat masih akurat? | Sebutkan koreksi jika ada, terutama deskripsi workshop/leadership KMTEDI, komunitas asal Klaten BKLASS, dan cakupan pelatihan Arcade/InJourney. Klaten pada CV dan Yogyakarta pada profil bisa berbeda konteks, sehingga tidak otomatis bertentangan. |

Jawaban boleh bertahap memakai ID F1–F8. Untuk F2, format ringkas per proyek:
`peran; periode; saya mengerjakan ...; tim mengerjakan ...; sumber ...`.
Jika fakta belum diketahui, catat **belum terkonfirmasi** dan tentukan apakah
klaim perlu ditahan/dihapus sebelum publish. Konfirmasi pemilik tetap dibedakan
dari bukti implementasi dan laporan pengujian.

### Jawaban pemilik, 24 November 2026

Alfiz menyatakan **F2, F4, F5, F7, dan F8 sudah sesuai**. Ini dicatat sebagai
konfirmasi pemilik atas konten saat ini, termasuk peran/kontribusi yang diklaim,
klaim teknis, periode organisasi, metadata kredensial, serta profil. Tidak
mengubahnya menjadi bukti runtime, laporan benchmark, atau verifikasi penerbit.
Perbedaan antara CMS, CV, dan dokumen yang dirinci di atas tetap menjadi catatan
sumber; tidak menyimpulkan alasan tanggal berbeda, pembagian modul tim, atau
status tidak kedaluwarsa hanya dari field expiry yang kosong.

- **F1:** Alfiz memperjelas bahwa pengunjung mengganti bahasa halaman dengan
  tombol EN/ID; pada tablet/HP tombol tersebut menggantikan tombol CV navbar.
  CV tetap tersedia lewat hero dan pilihan file CV tetap independen.
  Alfiz memiliki CV Inggris dan meminta dua unggahan PDF Indonesia/Inggris;
  dukungan disiapkan melalui field profil/pipeline media yang ada. File Inggris
  belum disediakan/dipilih, sehingga belum ada versi Inggris di snapshot.
- **F2/F4:** Klaim yang ada dipertahankan berdasarkan konfirmasi pemilik.
  Jangan menambah rincian kontribusi atau angka hasil pengujian baru.
- **F3:** Alfiz mengingat PHP SIA **8.2**. Nilai CMS sudah PHP 8.2 sehingga
  tidak memerlukan koreksi CMS untuk poin ini; versi runtime belum diverifikasi.
  Koreksi label TypeScript Lazuardy menjadi **JavaScript** disetujui pada
  konfirmasi berikutnya, sesuai source JavaScript/Vue yang diperiksa.
  Koreksi belum disimpan/publish: sesi ini hanya memiliki akses baca CMS.
  Jangan menyamarkannya sebagai perubahan terjemahan atau mengubah JSON
  snapshot tanpa terlebih dahulu mengubah sumber CMS.
- **F5:** Periode CMS diterima sebagai konfirmasi pemilik. Tidak mengarang
  bahwa Desember BLASTOUT merupakan masa persiapan atau menambah rentang akhir.
  Perbedaan dengan CV/tanggal kegiatan pada sertifikat tetap tercatat.
- **F6:** Domain demo SIA **boleh ditautkan publik**; menurut pemilik servernya
  sedang down. Pertahankan URL dan bedakan izin menautkan dari ketersediaan
  layanan; tidak mengklaim demo sudah pulih atau lulus QA fungsional.
- **F7/F8:** Konten saat ini diterima sebagai konfirmasi pemilik. Keterbatasan
  pemeriksaan tanggal/expiry penerbit dan perbedaan dokumen tetap dinyatakan.

Belum ada save/publish atau perubahan fakta pada CMS/snapshot. Dukungan dua CV
disiapkan pada sub-langkah sebelumnya. Setelah konfirmasi terakhir, giliran
berikutnya mengimplementasikan bilingual Task 14.4. Studi kasus Task 16.3 dan
publikasi belum dikerjakan.

## Penutupan Task 16.2 setelah konfirmasi

1. Catat jawaban Alfiz dan referensi tambahan; bedakan konfirmasi pemilik dari
   bukti source, dokumen penerbit, serta hasil tes aktual.
2. Siapkan copy final hanya untuk klaim yang didukung/disepakati. Gunakan field
   CMS yang ada, jangan mengubah schema atau memperdalam Task 16.3 di sini.
3. Koreksi melalui CMS → save dengan status yang sesuai → tinjau diff → publish.
   Edit JSON fallback saja tidak menyelesaikan koreksi sumber CMS.
4. Ambil/validasi snapshot published, cocokkan perubahan terhadap CMS, jalankan
   build/lint, lalu buktikan konten deployment aktif sesuai. Deploy hook diterima
   belum membuktikan deployment berhasil. Periksa teks/heading/tautan/modal
   pada 390px/1440px setelah copy berubah.
5. Centang 5.4/16.2 hanya setelah syarat masing-masing terpenuhi. Baru lanjut
   studi kasus Task 16.3 pada giliran berikutnya.

## Validasi audit awal

- Pembacaan CMS dan pembandingan snapshot: lulus, identik seperti hash di atas.
- Pemeriksaan sumber proyek: empat repository publik, commit dipatok di tautan.
- HTTP demo: dua merespons 200; SIA belum tersedia dari lingkungan pemeriksaan.
- Credly: metadata penerima/judul/penerbit sepuluh badge cocok; tanggal/expiry
  masih belum diverifikasi.
- Dokumen: lima PDF dan satu gambar sertifikat diperiksa.
- `npm run build`: lulus, termasuk pull CMS dan pemeriksaan TypeScript; hash
  snapshot tetap sama. Percobaan pertama terhalang jaringan sandbox; percobaan
  dengan izin jaringan berhasil. Peringatan ukuran chunk PDF yang sudah ada
  tetap muncul, tanpa kegagalan build.
- `npm run lint` dan `git diff --check`: lulus pada audit awal. Tidak menambah
  tes untuk perubahan dokumentasi. Hasil 48 tes Task 16.1 tercatat pada PR #14
  yang kini diwarisi branch audit; hasil tersebut bukan klaim pengujian ulang
  setelah sinkronisasi. Pemeriksaan sinkronisasi membuktikan isi Task 16.1
  tetap utuh dan perubahan audit berhasil dipulihkan sebelum dokumen diperbarui.
- Setelah sinkronisasi PR #14: build memakai fallback snapshot dengan empat
  variabel URL/anon-key Supabase dikosongkan hanya untuk proses build; lulus
  tanpa mengakses CMS. Lint, pemeriksaan referensi dokumen dan `git diff --check`
  lulus; hash snapshot tetap sama dan peringatan chunk PDF tetap ada.
  `docs/BACKUP.md`, `docs/SECURITY.md`, dan `.gitignore` identik dengan upstream;
  `TASKS.md` identik dengan upstream setelah dua catatan audit dikecualikan.
- Audit awal tidak mengubah UI; sub-langkah dua CV di bawah menambah kontrol
  pemilihan dokumen. QA viewport setelah perubahan UI/koreksi konten masih pending.

## Dukungan dua CV — validasi repository

- Form Profile & CV menampilkan dua pemilih/unggahan PDF, Indonesia dan Inggris.
  Pilihan file menjadi edit profil yang diterapkan melalui **Save profile**,
  lalu **Publish**; tidak menyimpan profil otomatis saat memilih file.
- `resumeUrl` lama dipertahankan sebagai CV Indonesia, `resumeEnglishUrl`
  opsional menampung file Inggris. Keduanya memakai media pipeline dan profil
  JSONB yang ada, tanpa migrasi atau dependency baru. File Inggris tidak
  diterjemahkan/dibuat oleh aplikasi; belum ada file Inggris aktual di snapshot.
- Modal publik menampilkan pilihan bahasa ketika kedua file tersedia.
  Preview, Open PDF, dan unduhan mengikuti dokumen terpilih. Profil lama tetap
  bekerja; menghapus pilihan Inggris tidak menghapus CV Indonesia atau file
  Storage. Riwayat PDF tetap mengecualikan PDF sertifikat.
- Build dengan fallback snapshot, lint, dan **52 tes regresi lulus**, tanpa
  skip, termasuk empat tes kompatibilitas/schema/publish CV. Kegagalan awal
  suite di sandbox berasal dari shared memory PostgreSQL dan port loopback;
  pengulangan dengan izin lokal lulus. Tes memakai data sintetis, bukan
  pengujian ulang restore production. Peringatan chunk PDF yang sudah ada tetap
  muncul pada build.
- Safari WebDriver tersedia, tetapi pembuatan sesi ditolak karena **Allow remote
  automation** tidak aktif. Pengaturan browser tidak diubah dan driver yang
  dijalankan dihentikan. QA interaksi/viewport **390px/1440px belum terverifikasi**.
- Snapshot publik, package/lockfile, `docs/BACKUP.md` dan `docs/SECURITY.md`
  tidak diubah. Tidak ada upload, save/publish CMS, rollout atau deployment.

## EN/ID dengan tombol navbar — implementasi Task 14.4

- Atas permintaan pemilik, pengunjung dapat mengganti bahasa halaman dengan
  tombol EN/ID. Di bawah 1280px, termasuk tablet 1024px dan HP, tombol tersebut
  menggantikan shortcut CV navbar. Desktop tetap memiliki kontrol bahasa.
  CV tetap tersedia lewat hero; pilihan file PDF terpisah dari bahasa halaman.
- Preferensi halaman tersimpan di browser ketika localStorage tersedia;
  `html.lang` mengikuti pilihan. Profil, hero, About, proyek/studi kasus,
  pengalaman, kredensial, kontak, footer, label modal, serta data VFS memakai
  view data sesuai bahasa. Command/path terminal, ID, slug, URL, nama resmi
  kredensial, teknologi dan file CV dipertahankan. Riwayat terminal dan input
  form tidak dihapus untuk mengganti bahasa; literal `echo` tidak diterjemahkan.
- Terjemahan memakai sumber `src/data`, dengan override CMS pada field
  `translations` JSONB opsional. Setiap entry mencatat teks sumber dan EN/ID;
  sumber yang berubah membatalkan override lama. Copy baru yang belum mempunyai
  terjemahan memakai teks dasarnya, bukan terjemahan otomatis atau karangan.
  Editor Profile & CV serta koleksi mendukung penyiapan/edit terjemahan melalui
  Save → Publish; preview koleksi dapat mengikuti EN/ID tanpa mengubah preferensi
  publik. Tidak menambah dependency, tabel, migrasi atau layanan.
- Build fallback, lint, `git diff --check`, dan **61 tes regresi lulus**, tanpa
  skip. Sembilan tes bilingual mencakup perlindungan identitas/tautan/CV,
  override usang, precision tanggal, schema/publish, render EN/ID, serta VFS.
  Pola statis tombol bahasa lolos. Inspector melewati pengukuran/screenshot
  karena tidak menemukan Chrome/Edge/Chromium; Safari remote automation juga
  belum tersedia. **QA browser 390/768/1024/1440px masih pending**. SSR tidak
  diperlakukan sebagai pengganti bukti layout atau interaksi browser.
- Snapshot produksi, dependency/lockfile, dan dokumen backup tetap utuh.
  Validasi lokal ini tidak melakukan save/publish CMS, upload media atau
  pemanggilan deploy hook production. Perubahan kode disiapkan untuk commit
  dan PR draft ke `dev`; status Task 14.4/16.2 tetap terbuka sampai bukti
  browser dan save/publish aktual tersedia.

Koreksi fakta yang sudah disetujui dan harus diterapkan ke sumber CMS saat
akses admin tersedia: `projects/bimbel-lazuardy`, field `techStack`:

```json
["Vue 3", "Vite", "Pinia", "Tailwind CSS", "JavaScript"]
```

Ini hanya mengganti elemen `TypeScript`; bukan terjemahan stack atau perubahan
field lain. Setelah Save → Publish, ambil snapshot dan periksa hasil aktif.
Sesi operator saat ini mempunyai konfigurasi baca publik, tanpa sesi admin
atau kredensial tulis CMS; nilai snapshot tidak diubah sendiri untuk
menyembunyikan kebutuhan pembaruan sumber tersebut.

[sim-root]: https://github.com/exenthiast/SIMPondok-Tahfidz-BE/tree/15daa117dd1bd5594a8a554166d5325ac0cb0941
[sim-readme]: https://github.com/exenthiast/SIMPondok-Tahfidz-BE/blob/15daa117dd1bd5594a8a554166d5325ac0cb0941/README.md
[sim-architecture]: https://github.com/exenthiast/SIMPondok-Tahfidz-BE/blob/15daa117dd1bd5594a8a554166d5325ac0cb0941/docs/architecture.md
[sim-db]: https://github.com/exenthiast/SIMPondok-Tahfidz-BE/blob/15daa117dd1bd5594a8a554166d5325ac0cb0941/docs/db-schema.dbml
[sim-service]: https://github.com/exenthiast/SIMPondok-Tahfidz-BE/blob/15daa117dd1bd5594a8a554166d5325ac0cb0941/snippets/SetoranHafalanService.php
[catalog-root]: https://github.com/exenthiast/uts-pl-543220/tree/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008
[catalog-composer]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/backend/composer.json
[catalog-lock]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/backend/composer.lock
[catalog-docker]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/backend/Dockerfile
[catalog-compose]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/docker-compose.yml
[catalog-frontend]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/frontend/package.json
[catalog-routes]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/backend/routes/api.php
[catalog-ci]: https://github.com/exenthiast/uts-pl-543220/blob/39b4a9d4fd9b9bc00e67501b7e88bebbefc11008/.github/workflows/ci.yml
[sia-root]: https://github.com/exenthiast/SIA-UGN-BE/tree/1f570f1c18d7442501f2170db3f27d96dc109960
[sia-readme]: https://github.com/exenthiast/SIA-UGN-BE/blob/1f570f1c18d7442501f2170db3f27d96dc109960/README.md
[sia-architecture]: https://github.com/exenthiast/SIA-UGN-BE/blob/1f570f1c18d7442501f2170db3f27d96dc109960/docs/architecture.md
[sia-gps]: https://github.com/exenthiast/SIA-UGN-BE/blob/1f570f1c18d7442501f2170db3f27d96dc109960/snippets/GpsService.php
[sia-pipeline]: https://github.com/exenthiast/SIA-UGN-BE/blob/1f570f1c18d7442501f2170db3f27d96dc109960/docs/cicd-pipeline.md
[lazuardy-root]: https://github.com/exenthiast/PAD-LAZUARDY-FRONTEND/tree/78db9a30c3116d54b09e31828cc838d753702043
[lazuardy-package]: https://github.com/exenthiast/PAD-LAZUARDY-FRONTEND/blob/78db9a30c3116d54b09e31828cc838d753702043/package.json
[lazuardy-router]: https://github.com/exenthiast/PAD-LAZUARDY-FRONTEND/blob/78db9a30c3116d54b09e31828cc838d753702043/src/router/index.js
[lazuardy-store]: https://github.com/exenthiast/PAD-LAZUARDY-FRONTEND/blob/78db9a30c3116d54b09e31828cc838d753702043/src/stores/registerStore.js
[huawei-image]: https://jxguhdwifjfnjxxgcjvz.supabase.co/storage/v1/object/public/media/2026/74050c3b-tangkapan-layar-2026-11-20-pada-22-00-23.webp
[ted-pdf]: https://jxguhdwifjfnjxxgcjvz.supabase.co/storage/v1/object/public/media/2026/0c01a0b5-sertifikat-ted.pdf
[tges-pdf]: https://jxguhdwifjfnjxxgcjvz.supabase.co/storage/v1/object/public/media/2026/0f6c593d-sertifikat-subko-tges25.pdf
[blastout-pdf]: https://jxguhdwifjfnjxxgcjvz.supabase.co/storage/v1/object/public/media/2026/86805b20-sertifikatblastout2025-alfizdesta.pdf
[orientation-pdf]: https://jxguhdwifjfnjxxgcjvz.supabase.co/storage/v1/object/public/media/2026/284de921-sertifikat-ligatrpl2024.pdf
[pionir-pdf]: https://jxguhdwifjfnjxxgcjvz.supabase.co/storage/v1/object/public/media/2026/a4868e05-sertifikat-pionir-alfiz-desta-ariant-per.pdf
