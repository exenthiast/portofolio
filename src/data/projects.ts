import type { Project } from '../types'

export const projectsData: Project[] = [
  {
    id: 'sim-pondok-tahfidz',
    slug: 'sim-pondok-tahfidz',
    title: 'SIM Pondok Tahfidz',
    category: 'Backend Developer',
    role: 'Lead Backend Developer',
    description:
      'Sistem Informasi Manajemen Pondok Tahfidz modern untuk tata kelola santri, kurikulum hafalan Al-Qur’an, pencatatan keuangan syariah, dan pelaporan wali santri secara real-time.',
    techStack: ['PHP 8.3', 'Laravel 11', 'PostgreSQL', 'Sanctum', 'Docker', 'Vercel'],
    liveDemoUrl: 'https://simpondokk.vercel.app/',
    githubUrl: 'https://github.com/exenthiast/SIMPondok-Tahfidz-BE',
    previewAsset: '/projects/project1.png',
    architecture: {
      overview: 'Modular monolithic architecture with strictly typed service-repository pattern, isolated tenant scopes, and atomic database transactions.',
      keyDecisions: [
        'PostgreSQL with JSONB fields for extensible tahfidz grade rubric.',
        'Laravel Sanctum token authentication with fine-grained role-based permission gates.',
        'Automated Dockerized container workflow for testing and migration pipelines.',
      ],
    },
    keyFeatures: [
      'Pelacakan setoran hafalan harian dan rekap musabaqah santri.',
      'Sistem penagihan iuran syahriah otomatis dengan notifikasi.',
      'Dashboard statistik perkembangan santri untuk asatidz dan wali.',
    ],
  },
  {
    id: 'sia-ugn',
    slug: 'sia-ugn',
    title: 'SIA UGN',
    category: 'Backend Developer',
    role: 'Backend Systems Engineer',
    description:
      'Sistem Informasi Akademik perguruan tinggi berkapasitas konkurensi tinggi untuk rencana studi mahasiswa, penjadwalan ruang kuliah otomatis, dan transkrip nilai terenkripsi.',
    techStack: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Docker'],
    liveDemoUrl: 'https://sia.trisuladana.com',
    githubUrl: 'https://github.com/exenthiast/SIA-UGN-BE',
    previewAsset: '/projects/project2.png',
    architecture: {
      overview: 'High-throughput RESTful API designed with Redis caching layer and optimistic concurrency locks for KRS traffic surges.',
      keyDecisions: [
        'Optimistic locking during course selection to prevent race conditions in capacity caps.',
        'In-memory Redis caching for fast syllabus and timetable lookup.',
        'Aggregation pipelines for rapid transcript GPA calculations.',
      ],
    },
    keyFeatures: [
      'Pengisian Kartu Rencana Studi (KRS) real-time dengan validasi prasyarat matakuliah.',
      'Algoritma penjadwalan kelas bebas bentrok dosen dan ruangan.',
      'API gateway terisolasi untuk integrasi data kelembagaan.',
    ],
  },
  {
    id: 'bimbel-lazuardy',
    slug: 'bimbel-lazuardy',
    title: 'Bimbel Lazuardy',
    category: 'Frontend Developer',
    role: 'Lead Frontend Developer',
    description:
      'Platform pembelajaran interaktif dan bimbingan belajar berbasis web dengan visualisasi progres siswa, tryout ujian berkala, dan modul interaktif.',
    techStack: ['Vue 3', 'Vite', 'Pinia', 'Tailwind CSS', 'TypeScript'],
    liveDemoUrl: 'https://lazuardy.trpl.space',
    githubUrl: 'https://github.com/exenthiast/PAD-LAZUARDY-FRONTEND',
    previewAsset: '/projects/project3.png',
    architecture: {
      overview: 'Composition API-driven Single Page Application with centralized Pinia reactive state stores and custom responsive design system tokens.',
      keyDecisions: [
        'Vue 3 Composition API with script setup for maximum type safety and render performance.',
        'Pinia state hydration for persistent student practice session states.',
        'Zero-dependency SVG chart rendering for progress telemetry.',
      ],
    },
    keyFeatures: [
      'Simulasi tryout dengan timer otomatis dan anti-kecurangan tab tracking.',
      'Analisis butir soal dan grafik penguasaan materi per siswa.',
      'Antarmuka ramah mobile untuk akses materi belajar di mana saja.',
    ],
  },
]
