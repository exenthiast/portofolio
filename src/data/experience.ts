import type { Experience } from '../types'

export const experienceData: Experience[] = [
  // Organizations
  {
    id: 'exp-kmtedi',
    category: 'organization',
    role: 'Anggota Divisi Minat dan Bakat',
    organization: 'KMTEDI UGM (Keluarga Mahasiswa Teknologi Rekayasa Perangkat Lunak)',
    period: '2024 – Sekarang',
    division: 'Minat dan Bakat',
    description:
      'Mengembangkan program pemberdayaan minat teknologi, kompetisi coding mahasiswa, dan fasilitasi workshop internal Software Engineering di lingkungan Departemen TEDI SV UGM.',
    skills: ['Community Leadership', 'Tech Workshop', 'Event Organization'],
  },
  {
    id: 'exp-bklass',
    category: 'organization',
    role: 'Anggota Divisi Minat dan Bakat',
    organization: 'BKLASS UGM',
    period: 'Okt 2024 – Okt 2025',
    division: 'Minat dan Bakat',
    description:
      'Mengkoordinasikan kegiatan pengembangan bakat dan kreativitas mahasiswa dalam komunitas lintas program studi di Universitas Gadjah Mada.',
    skills: ['Talent Development', 'Coordination', 'Project Planning'],
  },

  // Committees & Events
  {
    id: 'exp-ted',
    category: 'committee',
    role: 'Staff of Security Division',
    organization: 'Tech Enthusiast Day (TED UGM)',
    period: 'Okt 2025 – Des 2025',
    division: 'Security & Protocol',
    description:
      'Bertanggung jawab atas pengamanan perimeter, koordinasi alur evakuasi, dan protokol keselamatan selama rangkaian seminar teknologi dan pameran inovasi berskala nasional.',
    skills: ['Security Protocol', 'Crowd Management', 'Incident Response'],
  },
  {
    id: 'exp-trpl-league',
    category: 'committee',
    role: 'Sub Coordinator of Security Division',
    organization: 'TRPL League UGM',
    period: 'Nov 2025',
    division: 'Security & Logistics',
    description:
      'Memimpin sub-tim keamanan venue pertandingan e-sports dan kompetisi olahraga antar angkatan mahasiswa Teknologi Rekayasa Perangkat Lunak UGM.',
    skills: ['Team Leadership', 'Venue Safety', 'Risk Assessment'],
  },
  {
    id: 'exp-blastout',
    category: 'committee',
    role: 'Staff of Public Relations & Transportation Accommodation Division',
    organization: 'BLASTOUT UGM',
    period: 'Des 2024',
    division: 'PR & Accommodation',
    description:
      'Menangani kemitraan media eksternal, akomodasi pemateri nasional, dan mobilisasi logistik delegasi kampus.',
    skills: ['Public Relations', 'Logistics Operations', 'Sponsorship Liaison'],
  },

  // Training & Certifications
  {
    id: 'exp-gc-arcade',
    category: 'training',
    role: 'Google Cloud Arcade Challenge Participant',
    organization: 'Dicoding Indonesia × Google Cloud',
    period: 'Jul 2026 – Sep 2026',
    division: 'Cloud Architecture & DevOps',
    description:
      'Program intensif hands-on lab Qwiklabs menyelesaikan skenario komputasi awan, container orchestration Kubernetes GKE, IAM security, dan arsitektur microservices terdistribusi.',
    skills: ['Google Cloud Platform', 'Kubernetes GKE', 'Terraform', 'BigQuery'],
  },
  {
    id: 'exp-injourney',
    category: 'training',
    role: 'Injourney Hospitality House Participant',
    organization: 'PT Aviasi Pariwisata Indonesia (Persero)',
    period: 'Jun 2026',
    division: 'Professional Development',
    description:
      'Pelatihan kepemimpinan, komunikasi profesional, dan standar pelayanan prima BUMN dalam ekosistem aviasi dan pariwisata nasional.',
    skills: ['Professional Communication', 'Service Excellence', 'Leadership'],
  },
]
