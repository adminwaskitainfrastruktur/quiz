/*
 * ISI KUESIONER — sumber: "Kuesioner WASKITA v2" (19 Okt 2026) + revisi Book1.xlsx (2 Nov 2026).
 *
 * Ubah teks, opsi, atau urutan pertanyaan di file ini saja; tampilan,
 * validasi, ringkasan, dan data yang dikirim ke database mengikuti otomatis.
 *
 * Tipe pertanyaan:
 *   text       isian singkat              textarea   isian paragraf
 *   radio      pilih satu                 checkbox   pilih beberapa (max = batas pilihan)
 *   scale      skala angka (min..max)     matrix     beberapa baris dinilai 1–5
 *   allocation porsi persen, total 100%   repeater   tabel isian berulang (baris bisa ditambah)
 *
 * Variasi: radio + dropdown:true → daftar tarik-turun; text + format:'email' → cek alamat email;
 * matrix + unique:true → setiap nilai hanya boleh dipakai satu kali (peringkat).
 *
 * Kunci umum:
 *   num       nomor pertanyaan (dipakai juga sebagai nama kolom di database)
 *   short     judul singkat untuk nama kolom/ringkasan
 *   required  true = wajib diisi (tanda *)
 *   showIf    fungsi(jawaban) → true bila pertanyaan ditampilkan (logika lompat)
 *   Opsi berbentuk { label, input } menampilkan kolom isian tambahan saat dipilih,
 *   mis. "Lainnya: ____".
 */
import type { Answers, ChoiceAnswer, MultiAnswer, Option, Survey } from './types';

// Nilai yang dipilih pada pertanyaan pilih-satu
const pilihan = (a: Answers, num: string): string => (a[num] as ChoiceAnswer | undefined)?.value ?? '';
// Apakah opsi tertentu dicentang pada pertanyaan pilih-beberapa
const dicentang = (a: Answers, num: string, label: string): boolean =>
  !!(a[num] as MultiAnswer | undefined)?.values?.includes(label);

const PROVINSI = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung',
  'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat',
  'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Selatan', 'Papua Tengah',
  'Papua Pegunungan',
];

// Kelompok alat untuk 2.6 (a → b). Urutan ini juga menentukan ilustrasi di kartu pilihan.
const KELOMPOK_ALAT = [
  {
    label: 'Earthworks Equipment',
    hint: 'Alat untuk proses pekerjaan tanah.',
    types: ['Excavator', 'Dozer', 'Vibrator Roller', 'Vibrator Sheepfoot', 'Wheel Loader', 'Motor Grader'],
  },
  {
    label: 'Transportation Equipment',
    hint: 'Alat untuk hauling material serta mobilisasi/demobilisasi.',
    types: ['Dumptruck', 'Self Loader Crane', 'Truck Flat Bed', 'Truck Low Bed', 'Truck Ankle', 'Water Tank Container'],
  },
  {
    label: 'Material Production Equipment',
    hint: 'Alat untuk proses produksi material.',
    types: ['Stone Crusher Plant', 'Asphalt Mixing Plant', 'Batching Plant', 'Steel Production Plant'],
  },
  {
    label: 'Lifting Production Equipment',
    hint: 'Alat untuk proses pengangkatan (lifting).',
    types: ['Tower Crane', 'Crawler Crane', 'Rough Terrain Crane', 'Boomlift', 'Forklift'],
  },
  {
    label: 'Measurement & Survey Equipment',
    hint: 'Alat untuk pekerjaan pengukuran dan survei.',
    types: ['Total Station', 'Waterpass', 'Theodolite', 'GPS System', 'Drone Camera', 'Weight Bridge'],
  },
  {
    label: 'Erection Equipment',
    hint: 'Alat untuk pekerjaan erection.',
    types: ['Erection Tools', 'Ginpole Tools', 'Stringing Tools'],
  },
  {
    label: 'Light Equipment',
    hint: 'Alat ringan di luar alat berat untuk mendukung pekerjaan konstruksi.',
    types: ['Generating Set', 'Compressor'],
  },
  {
    label: 'Others Equipment',
    hint: 'Alat lain untuk mendukung pekerjaan konstruksi.',
    types: ['Bar Bender', 'Bar Cutter', 'Pompa', 'Scaffolding'],
  },
];

const LAINNYA = (placeholder?: string): Option => ({ label: 'Lainnya', input: placeholder || 'Sebutkan' });

const SUBKON = 'Subkon paket pekerjaan ke WKI';
// 3.8–3.9 hanya relevan bila responden memilih bentuk sewa (bukan hanya subkon)
const pilihSewa = (a: Answers) => {
  const v = (a['3.7'] as MultiAnswer | undefined)?.values ?? [];
  return v.length === 0 || v.some((x) => x !== SUBKON);
};
const pakaiAlatWki = (a: Answers) => pilihan(a, '4.1') === 'Ya';


export const SURVEY: Survey = {
  org: 'PT Waskita Karya Infrastruktur',
  title: 'Survei Kebutuhan & Layanan Peralatan',
  subtitle: 'Untuk stakeholder WSKT · Rencana 2027–2029',
  version: 'v3',
  duration: '± 15 menit',

  intro: {
    lead:
      'PT Waskita Karya Infrastruktur (WKI) berencana menyusun ulang pengelolaan, layanan, ' +
      'dan rencana investasi peralatan. Melalui survei singkat ini, kami ingin mendengar ' +
      'kebutuhan dan harapan Bapak/Ibu, agar peralatan yang kami siapkan benar-benar ' +
      'mendukung proyek Bapak/Ibu.',
    goals: [
      { icon: 'gauge', title: 'Kondisi & biaya alat', text: 'Kondisi dan biaya pemanfaatan peralatan saat ini.' },
      { icon: 'handshake', title: 'Tarif & kerja sama', text: 'Pandangan terhadap skema tarif sewa dan bentuk kerja sama dengan WKI.' },
      { icon: 'calendar', title: 'Kebutuhan 2027–2029', text: 'Jenis, jumlah, waktu, lokasi, dan durasi kebutuhan alat.' },
      { icon: 'wrench', title: 'Layanan & SLA', text: 'Harapan terhadap layanan dan tingkat layanan (SLA) WKI.' },
    ],
    privacy: 'Tidak ada jawaban benar atau salah. Jawaban diolah dan dilaporkan secara agregat.',
    thanks: 'Terima kasih atas waktu dan partisipasi Bapak/Ibu.',
  },

  steps: [
    // ───────────────────────────────── Bagian 1
    {
      id: 'profil',
      kicker: 'Bagian 1',
      title: 'Profil responden',
      desc: 'Membantu kami membaca jawaban sesuai peran Bapak/Ibu.',
      questions: [
        { num: '1.1', type: 'text', title: 'Nama', short: 'Nama', placeholder: 'Boleh dikosongkan', autocomplete: 'name' },
        {
          num: '1.2', type: 'text', format: 'email', required: true,
          title: 'Alamat email', short: 'Email',
          placeholder: 'nama@contoh.co.id', autocomplete: 'email',
        },
        {
          num: '1.3', type: 'radio', dropdown: true, required: true,
          title: 'Jabatan/posisi', short: 'Jabatan',
          options: [
            'Kepala Divisi',
            'Kepala Departemen',
            'Manager',
            'Kepala Proyek / Project Manager',
            'Site Manager',
            'Supervisor / Kepala Seksi',
            'Engineer',
            'Staf',
            LAINNYA('Sebutkan jabatan'),
          ],
        },
        {
          num: '1.4', type: 'radio', title: 'Divisi/departemen', required: true,
          options: [
            'Divisi Infrastruktur I',
            'Divisi Infrastruktur II',
            'Divisi Infrastruktur III',
            'Divisi Gedung',
            'Head Office',
            LAINNYA('Sebutkan divisi/departemen'),
          ],
        },
        {
          num: '1.5', type: 'text', title: 'Proyek yang sedang dikelola', short: 'Proyek', required: true,
          hint: 'Tulis nama proyek dan provinsinya. Bila tidak sedang mengelola proyek, cukup tulis “Kantor”.',
          placeholder: 'Contoh: SPAM Regional X – Jawa Barat',
        },
        {
          num: '1.6', type: 'radio', title: 'Peran Anda dalam keputusan pengadaan atau sewa alat di proyek',
          short: 'Peran dalam pengadaan/sewa', required: true,
          options: ['Pengambil keputusan', 'Pemberi rekomendasi', 'Pengguna alat', 'Tidak terlibat'],
        },
      ],
    },

    // ───────────────────────────────── Bagian 2
    {
      id: 'kondisi',
      kicker: 'Bagian 2',
      title: 'Kondisi saat ini dan biaya alat',
      desc: 'Gambaran pemakaian dan biaya alat di proyek Bapak/Ibu sekarang.',
      questions: [
        {
          num: '2.1', type: 'scale', required: true,
          title: 'Seberapa bergantung pelaksanaan proyek Anda pada ketersediaan alat?',
          short: 'Ketergantungan pada ketersediaan alat',
          min: 1, max: 5, labels: ['Sangat rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat tinggi'],
        },
        {
          num: '2.2', type: 'allocation', required: true,
          title: 'Perkirakan porsi penyediaan alat di proyek Anda saat ini',
          short: 'Porsi penyediaan alat',
          hint: 'Isi dalam persen; totalnya harus 100%.',
          rows: ['Alat yang dikelola unit bisnis atau dikelola WKI', 'Alat milik subkontraktor', 'Sewa dari vendor eksternal'],
        },
        {
          num: '2.3', type: 'radio', required: true,
          title: 'Berapa total unit alat yang digunakan pada proyek saat ini?',
          short: 'Total unit alat di proyek',
          options: ['1–5 unit', '6–10 unit', '11–15 unit', '16–20 unit', '21–25 unit', '> 25 unit'],
        },
        {
          num: '2.4', type: 'checkbox', required: true,
          title: 'Biaya alat apa saja yang saat ini dibebankan ke proyek untuk alat yang dikelola unit bisnis?',
          short: 'Biaya alat yang dibebankan ke proyek',
          hint: 'Boleh pilih lebih dari satu.',
          exclusive: ['Tidak ada biaya yang dibebankan'],
          options: [
            'Depresiasi',
            'Administrasi alat (asuransi, SILO, STNK, KIR)',
            'Maintenance (preventive dan corrective)',
            'Gaji operator',
            'Gaji mekanik',
            'Bahan bakar',
            'Tidak ada biaya yang dibebankan',
            LAINNYA(),
          ],
        },
        {
          num: '2.5', type: 'radio', required: true,
          title: 'Perkiraan total biaya alat yang dibebankan ke proyek per bulan',
          short: 'Total biaya alat per bulan',
          options: ['< Rp100 juta', 'Rp100–250 juta', '> Rp250–500 juta', '> Rp500 juta–Rp1 miliar', '> Rp1 miliar', 'Tidak tahu'],
        },
        {
          num: '2.6', type: 'repeater', required: true,
          title: 'Untuk alat yang paling sering Anda sewa dari vendor eksternal, berapa tarif yang dibayar?',
          short: 'Tarif sewa vendor eksternal',
          tableName: 'Tarif vendor eksternal',
          hint: 'Isi untuk 1–3 alat. Tarif ini dipakai sebagai pembanding harga WKI.',
          itemLabel: 'Alat',
          initialRows: 1, maxRows: 3, minFilled: 1,
          optOut: 'Proyek saya tidak menyewa alat dari vendor eksternal',
          example: 'a. Earthworks Equipment · b. Excavator · 20 T · Rp45.000.000 per bulan · termasuk operator · tidak termasuk BBM',
          fields: [
            {
              id: 'kategori', type: 'radio', wide: true, column: 'Kelompok alat',
              label: 'a. Jenis dan kapasitas alat apa saja yang menjadi preferensi Anda?',
              choices: KELOMPOK_ALAT.map(({ label, hint }) => ({ label, hint })),
            },
            {
              id: 'tipe', type: 'checks', wide: true, column: 'Tipe alat',
              label: 'b. Tipe alat apa yang paling sering Anda sewa dari vendor eksternal?',
              dependsOn: 'kategori',
              optionsBy: Object.fromEntries(KELOMPOK_ALAT.map((k) => [k.label, k.types])),
              other: 'Sebutkan tipe alat lainnya',
            },
            { id: 'kapasitas', label: 'Kapasitas/spesifikasi', type: 'text', placeholder: 'Contoh: 20 T', optional: true },
            { id: 'tarif', label: 'Tarif (Rp)', type: 'currency', placeholder: '45.000.000' },
            { id: 'satuan', label: 'Satuan', type: 'select', options: ['per jam', 'per hari', 'per bulan'] },
            { id: 'operator', label: 'Termasuk operator?', type: 'yesno' },
            { id: 'bbm', label: 'Termasuk BBM?', type: 'yesno' },
          ],
        },
        {
          num: '2.7', type: 'textarea',
          title: 'Alat lainnya: adakah alat lain di luar alat di atas yang sering Anda sewa dari vendor eksternal?',
          short: 'Alat lain di luar 3 alat',
          hint: 'Tuliskan jenis alatnya, atau saran Bapak/Ibu terkait sewa alat.',
          placeholder: 'Contoh: concrete pump 36 m, sekitar Rp60 juta per bulan',
        },
      ],
    },

    // ───────────────────────────────── Bagian 3
    {
      id: 'tarif',
      kicker: 'Bagian 3',
      title: 'Penerimaan tarif dan skema kerja sama',
      desc: 'Pandangan Bapak/Ibu tentang tarif sewa dan bentuk kerja sama dengan WKI.',
      questions: [
        {
          num: '3.1', type: 'radio', required: true,
          title: 'Alat yang dikelola WKI dan dipakai proyek dikenakan tarif sewa. Bagaimana penerimaan Anda?',
          short: 'Penerimaan tarif sewa WKI',
          options: ['Sangat menerima', 'Menerima', 'Netral', 'Kurang menerima', 'Tidak menerima', 'Belum dapat menentukan'],
        },
        {
          num: '3.2', type: 'matrix', unique: true, required: true,
          showIf: (a) => ['Kurang menerima', 'Tidak menerima'].includes(pilihan(a, '3.1')),
          title: 'Seberapa besar faktor berikut menjadi alasan keberatan Anda?',
          short: 'Alasan keberatan',
          hint: 'Urutkan kelima faktor: 5 = alasan paling utama, 1 = alasan paling kecil. Setiap nilai hanya boleh dipakai satu kali.',
          labels: ['Paling kecil', 'Kecil', 'Sedang', 'Besar', 'Paling utama'],
          rows: [
            'Aspek biaya (tarif yang kurang kompetitif dan margin sewa)',
            'Umur alat sudah tua',
            'Produktivitas alat kurang optimal',
            'Jasa pelayanan maintenance',
            'Proses administrasi lambat (respons admin)',
          ],
        },
        {
          num: '3.3', type: 'radio', required: true,
          title: 'Apakah dampak tarif sewa WKI sudah diperhitungkan dalam Anggaran Pelaksanaan Proyek (APP)?',
          short: 'Dampak tarif dalam APP',
          options: [
            'Sudah dimitigasi dan sudah masuk APP',
            'Sudah dimitigasi, tetapi belum masuk APP',
            'Belum dimitigasi, tetapi masih bisa disesuaikan dalam APP',
            'Belum dimitigasi dan berpotensi menambah biaya proyek',
            'Tidak berdampak ke APP',
          ],
        },
        {
          num: '3.4', type: 'radio', required: true,
          title: 'Dibanding biaya alat saat ini, berapa perkiraan perubahan biaya proyek akibat tarif sewa WKI?',
          short: 'Perubahan biaya proyek',
          options: ['Turun', '0–5%', '> 5–10%', '> 10–15%', '> 15–25%', '> 25%', 'Belum tahu'],
        },
        {
          num: '3.5', type: 'radio', required: true,
          title: 'Untuk alat dengan spesifikasi dan kondisi setara, pada harga berapa Anda akan memilih WKI dibanding vendor eksternal?',
          short: 'Harga untuk memilih WKI',
          options: [
            'Sama dengan harga vendor',
            'Lebih murah sampai 5%',
            'Lebih murah > 5–10%',
            'Lebih murah > 10–20%',
            'Lebih murah > 20%',
            'Tetap memilih vendor eksternal',
          ],
        },
        {
          num: '3.6', type: 'matrix', unique: true, required: true,
          title: 'Pilih 5 aspek terpenting saat Anda memilih alat dan layanan WKI',
          short: 'Top 5 aspek terpenting',
          hint: 'Beri nilai 5 untuk aspek paling penting sampai 1 untuk urutan kelima. Setiap nilai hanya boleh dipakai satu kali; dua aspek dibiarkan kosong.',
          labels: ['Urutan ke-5', 'Urutan ke-4', 'Urutan ke-3', 'Urutan ke-2', 'Paling penting'],
          rows: [
            'Tarif sewa kompetitif',
            'Ketersediaan alat saat dibutuhkan',
            'Kondisi fisik dan performa alat (usia, spesifikasi)',
            'Kecepatan perbaikan atau penggantian unit',
            'Fleksibilitas kontrak (sewa per jam, harian, bulanan)',
            'Kemudahan administrasi dan pembayaran',
            'Ketersediaan operator dan mekanik',
          ],
        },
        {
          num: '3.7', type: 'checkbox', required: true, max: 2,
          title: 'Bentuk kerja sama dengan WKI yang paling Anda sukai',
          short: 'Bentuk kerja sama',
          hint: 'Pilih maksimal 2.',
          options: [
            'Sewa alat saja (tanpa operator)',
            'Sewa alat dengan operator',
            'Sewa all-in (alat, operator, BBM)',
            SUBKON,
          ],
        },
        {
          num: '3.8', type: 'radio', required: true,
          showIf: pilihSewa,
          title: 'Bila menyewa alat dari WKI dengan tarif dan kualitas yang kompetitif, berapa lama Anda bersedia berkontrak sewa?',
          short: 'Lama kontrak sewa',
          hint: 'Tidak ditanyakan bila Anda hanya memilih subkon paket pekerjaan.',
          options: [
            'Per kebutuhan, tanpa kontrak jangka panjang',
            'Sesuai durasi proyek',
            '12 bulan',
            '24 bulan',
            '36 bulan atau lebih',
            'Tidak bersedia',
          ],
        },
        {
          num: '3.9', type: 'radio', required: true,
          showIf: pilihSewa,
          title: 'Skema pembayaran sewa yang paling sesuai',
          short: 'Skema pembayaran',
          options: [
            'Bulanan sesuai pemakaian',
            'Sesuai progres termin proyek',
            'Pemotongan langsung dari anggaran proyek',
            LAINNYA('Sebutkan skema pembayaran'),
          ],
        },
      ],
    },

    // ───────────────────────────────── Bagian 4A
    {
      id: 'kebutuhan',
      kicker: 'Bagian 4A',
      title: 'Kebutuhan alat 2027–2029',
      desc: 'Kebutuhan alat, subkontraktor, dan divestasi alat — dimulai dari alat yang Bapak/Ibu pakai sekarang.',
      bridge: 'Terima kasih atas pandangan Bapak/Ibu soal tarif. Sekarang kita beralih ke rencana: alat apa saja yang perlu disiapkan WKI untuk proyek Bapak/Ibu ke depan.',
      questions: [
        {
          num: '4.1', type: 'radio', required: true,
          title: 'Apakah proyek Anda saat ini memakai alat WKI?',
          short: 'Memakai alat WKI',
          options: ['Ya', 'Tidak'],
        },
        {
          num: '4.2', type: 'radio', required: true,
          showIf: pakaiAlatWki,
          title: 'Apakah ada alat WKI yang masih Anda butuhkan untuk jangka panjang (lebih dari 12 bulan)?',
          short: 'Alat WKI dibutuhkan jangka panjang',
          options: [{ label: 'Ya', input: 'Sebutkan jenis alat dan jumlah unitnya, mis. 2 unit crawler crane 50 T' }, 'Tidak'],
        },
        {
          num: '4.3', type: 'matrix', required: true,
          title: 'Jenis alat mana yang paling perlu disiapkan WKI untuk proyek Anda ke depan?',
          short: 'Kebutuhan jenis alat',
          labels: ['Tidak dibutuhkan', 'Kurang dibutuhkan', 'Cukup dibutuhkan', 'Dibutuhkan', 'Sangat dibutuhkan'],
          rows: [
            { label: 'Earth Works', hint: 'Excavator, bulldozer, motor grader, vibro roller' },
            { label: 'Transportation', hint: 'Dump truck, truck mixer, truck tangki air' },
            { label: 'Flexible Pavement / Asphalt', hint: 'Asphalt finisher, tandem roller, PTR, cold milling' },
            { label: 'Rigid Pavement', hint: 'Slipform paver, slipform barrier' },
            { label: 'Concrete Activity', hint: 'Concrete pump, batching plant' },
            { label: 'Foundation', hint: 'Bored pile rig, mini bore pile, pile driver' },
            { label: 'Lifting', hint: 'Crawler crane, RT crane, tower crane, passenger hoist' },
            { label: 'Material Production', hint: 'Stone crusher, AMP' },
            { label: 'Supporting / Light Equipment', hint: 'Flat bed truck crane, genset, compressor' },
            { label: 'Surveying', hint: 'Total station, GPS geodetic' },
          ],
        },
        {
          num: '4.4', type: 'repeater', required: true,
          title: 'Rincian kebutuhan alat untuk proyek berjalan dan proyek yang direncanakan',
          short: 'Rincian kebutuhan alat',
          tableName: 'Kebutuhan alat',
          hint: 'Isi alat prioritas Anda, idealnya minimal 3. Lebih dari 3 alat? Tekan "Tambah alat".',
          itemLabel: 'Alat',
          initialRows: 3, maxRows: 30, minFilled: 1,
          optOut: 'Belum ada kebutuhan alat untuk proyek berjalan maupun yang direncanakan',
          example: '4 unit Excavator Mini 8 T · SPAM Regional X, Jawa Barat · mulai Mar 2027 · 18 bulan · 200 jam/bulan · sudah kontrak',
          fields: [
            { id: 'jenis', label: 'Jenis dan kapasitas alat', type: 'text', placeholder: 'Contoh: Excavator Mini 8 T', wide: true },
            { id: 'jumlah', label: 'Jumlah unit', type: 'int', min: 1, max: 999, suffix: 'unit' },
            { id: 'proyek', label: 'Nama proyek', type: 'text', placeholder: 'Contoh: SPAM Regional X' },
            { id: 'provinsi', label: 'Provinsi', type: 'select', options: PROVINSI },
            { id: 'mulai', label: 'Bulan mulai', type: 'month', years: [2024, 2025, 2026, 2027, 2028, 2029, 2030] },
            { id: 'durasi', label: 'Durasi', type: 'int', min: 1, max: 120, suffix: 'bulan' },
            { id: 'jam', label: 'Jam operasi per bulan', type: 'int', min: 1, max: 744, suffix: 'jam' },
            { id: 'status', label: 'Status proyek', type: 'select', options: ['Sudah kontrak', 'Sedang tender', 'Rencana'] },
          ],
        },
        {
          num: '4.5', type: 'checkbox', max: 3,
          title: 'Merk alat berat yang paling Anda sukai',
          short: 'Merk alat berat favorit',
          hint: 'Pilih maksimal 3.',
          options: [
            'Caterpillar', 'Komatsu', 'Hitachi', 'Kobelco', 'Volvo', 'Hyundai', 'SANY', 'XCMG',
            'LiuGong', 'Develon (Doosan)', 'Sakai', 'Dynapac', 'Bomag', LAINNYA('Sebutkan merk'),
          ],
        },
        {
          num: '4.6', type: 'checkbox', max: 3,
          title: 'Merk kendaraan pendukung yang paling Anda sukai',
          short: 'Merk kendaraan pendukung favorit',
          hint: 'Pilih maksimal 3.',
          options: ['Hino', 'Isuzu', 'Mitsubishi Fuso', 'UD Trucks', 'Quester', 'Mercedes-Benz', 'Volvo', LAINNYA('Sebutkan merk')],
        },
        {
          num: '4.7', type: 'checkbox', required: true, max: 3,
          title: 'Pertimbangan utama dalam memilih merk',
          short: 'Pertimbangan memilih merk',
          hint: 'Pilih maksimal 3.',
          options: [
            'Keandalan dan durabilitas',
            'Produktivitas',
            'Efisiensi bahan bakar',
            'Kemudahan maintenance',
            'Ketersediaan sparepart dan layanan dealer di lokasi proyek',
            'Nilai jual kembali',
            'Pengalaman menggunakan merk tersebut',
            LAINNYA(),
          ],
        },
      ],
    },

    // ───────────────────────────────── Bagian 4B
    {
      id: 'subkon',
      kicker: 'Bagian 4B',
      title: 'Subkon paket pekerjaan',
      desc: 'Peluang kerja sama paket pekerjaan dengan WKI.',
      bridge: 'Data kebutuhan alat sudah tercatat. Selain menyewakan alat, WKI juga dapat mengerjakan paket pekerjaan sebagai subkontraktor. Bagian ini menggali peluang tersebut.',
      questions: [
        {
          num: '4.8', type: 'checkbox', required: true,
          title: 'Paket pekerjaan apa yang bersedia Anda subkonkan ke WKI?',
          short: 'Paket pekerjaan untuk subkon',
          hint: 'Boleh pilih lebih dari satu.',
          exclusive: ['Tidak ada'],
          options: [
            'Preservasi atau overlay jalan',
            'Pekerjaan tanah',
            'Perpipaan SPAM/IPAL',
            'Fondasi',
            'Beton dan struktur gedung',
            'Rigid pavement',
            'Tidak ada',
            LAINNYA(),
          ],
        },
        {
          num: '4.9', type: 'radio',
          showIf: (a) => !dicentang(a, '4.8', 'Tidak ada'),
          title: 'Perkiraan nilai paket subkon yang bisa diberikan ke WKI pada 2027',
          short: 'Nilai paket subkon 2027',
          options: ['< Rp10 miliar', 'Rp10–50 miliar', '> Rp50–100 miliar', '> Rp100 miliar', 'Belum dapat diperkirakan'],
        },
        {
          num: '4.10', type: 'radio',
          showIf: (a) => !dicentang(a, '4.8', 'Tidak ada'),
          title: 'Apakah Anda bersedia melibatkan WKI sejak tahap tender (dukungan penyusunan harga dan metode kerja)?',
          short: 'Melibatkan WKI sejak tender',
          options: ['Ya, untuk semua tender yang relevan', 'Ya, untuk tender tertentu', 'Tidak'],
        },
      ],
    },

    // ───────────────────────────────── Bagian 5
    {
      id: 'layanan',
      kicker: 'Bagian 5',
      title: 'Layanan dan SLA',
      desc: 'Harapan Bapak/Ibu terhadap layanan WKI.',
      bridge: 'Hampir selesai! Bagian terakhir ini tentang standar layanan (SLA) yang Bapak/Ibu harapkan dari WKI.',
      questions: [
        {
          num: '5.1', type: 'radio', required: true,
          title: 'Berapa batas maksimum waktu perbaikan yang masih dapat diterima proyek?',
          short: 'Batas waktu perbaikan',
          options: ['≤ 24 jam', '1–2 hari', '3–5 hari'],
        },
        {
          num: '5.2', type: 'radio', required: true,
          title: 'Bila perbaikan melewati batas tersebut, apakah proyek membutuhkan alat pengganti dari WKI?',
          short: 'Kebutuhan alat pengganti',
          options: ['Ya, selalu', 'Ya, untuk alat kritis saja', 'Tidak perlu'],
        },
        {
          num: '5.3', type: 'matrix', required: true,
          showIf: pakaiAlatWki,
          title: 'Bagaimana penilaian Anda terhadap layanan operator dan mekanik WKI?',
          short: 'Layanan operator dan mekanik',
          hint: 'Muncul karena proyek Anda saat ini memakai alat WKI.',
          labels: ['Sangat buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat baik'],
          rows: [
            'Keterampilan operator mengoperasikan alat',
            'Kedisiplinan dan keselamatan kerja operator',
            'Kecepatan respons mekanik saat alat rusak',
            'Kualitas hasil perbaikan oleh mekanik',
          ],
        },
        {
          num: '5.4', type: 'scale', required: true,
          title: 'Secara keseluruhan, bagaimana penilaian Anda terhadap kinerja WKI dalam menyediakan alat saat ini?',
          short: 'Penilaian kinerja WKI',
          min: 1, max: 10, minLabel: 'Sangat buruk', maxLabel: 'Sangat baik',
        },
        {
          num: '5.5', type: 'scale', required: true,
          title: 'Seberapa besar kemungkinan Anda merekomendasikan WKI sebagai penyedia alat kepada proyek lain?',
          short: 'Kemungkinan merekomendasikan WKI',
          min: 0, max: 10, minLabel: 'Tidak mungkin', maxLabel: 'Sangat mungkin',
        },
        {
          num: '5.6', type: 'textarea', required: true,
          title: 'Satu hal yang paling perlu diperbaiki WKI',
          short: 'Hal yang perlu diperbaiki',
          placeholder: 'Tulis jawaban Anda',
        },
      ],
    },

    // ───────────────────────────────── Penutup
    {
      id: 'penutup',
      kicker: 'Penutup',
      title: 'Satu pertanyaan terakhir',
      desc: 'Setelah ini Anda bisa memeriksa semua jawaban sebelum mengirim.',
      questions: [
        {
          num: '6.1', type: 'radio', required: true,
          title: 'Jika dibutuhkan data tambahan berkaitan dengan kuesioner ini, apakah Anda bersedia dihubungi kembali?',
          short: 'Bersedia dihubungi kembali',
          hint: 'Kami akan menghubungi melalui alamat email yang Anda isi di Bagian 1.',
          options: ['Ya, saya bersedia', 'Tidak'],
        },
      ],
    },
  ],
};
