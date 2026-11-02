import { describe, expect, it } from 'vitest';
import { answerText, buildPayload, fieldOptions, isVisible, validate } from './logic';
import { SURVEY } from './survey';
import type { Answers, Question, RepeaterQ } from './types';

const ALL = SURVEY.steps.flatMap((s) => s.questions);
const Q = (num: string): Question => {
  const q = ALL.find((x) => x.num === num);
  if (!q) throw new Error(`Pertanyaan ${num} tidak ada`);
  return q;
};

describe('struktur kuesioner', () => {
  it('nomor pertanyaan unik dan berurutan per bagian', () => {
    const nums = ALL.map((q) => q.num);
    expect(new Set(nums).size).toBe(nums.length);
    expect(nums).toEqual([
      '1.1', '1.2', '1.3', '1.4', '1.5', '1.6',
      '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7',
      '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9',
      '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10',
      '5.1', '5.2', '5.3', '5.4', '5.5', '5.6',
      '6.1',
    ]);
  });

  it('revisi: teks lama sudah dihapus', () => {
    const text = JSON.stringify(SURVEY);
    expect(text).not.toMatch(/Pasca inbreng/);
    expect(text).not.toMatch(/identitas responden tidak dicantumkan/);
    expect(text).not.toMatch(/Biaya mobilisasi/);
    expect(text).not.toMatch(/KJPP/); // pertanyaan minat beli alat dilepas dihapus
    expect(text).not.toMatch(/tidak lagi dibutuhkan proyek/); // pertanyaan pelepasan alat dihapus
    expect(text).not.toMatch(/Masukan lain terkait kebutuhan/);
    expect(text).not.toMatch(/rata-rata waktu dari laporan kerusakan/);
  });
});

describe('validasi', () => {
  it('semua pertanyaan wajib diisi (tidak ada yang opsional)', () => {
    expect(ALL.filter((q) => !q.required).map((q) => q.num)).toEqual([]);
    for (const q of ALL) if (q.type === 'repeater') expect(q.fields.filter((f) => f.optional)).toEqual([]);
    expect(validate(Q('1.1'), {})?.message).toMatch(/wajib/);
    expect(validate(Q('1.2'), {})?.message).toMatch(/wajib/);
  });

  it('format email', () => {
    expect(validate(Q('1.2'), { '1.2': 'budi' })?.message).toMatch(/email/);
    expect(validate(Q('1.2'), { '1.2': 'budi@waskita' })?.message).toMatch(/email/);
    for (const ok of [' budi@waskita.co.id ', 'budi.s@gmail.com', 'budi@outlook.com', 'b_santoso@yahoo.co.id']) {
      expect(validate(Q('1.2'), { '1.2': ok })).toBeNull();
    }
  });

  it('dropdown jabatan dengan "Lainnya" harus diisi', () => {
    expect(validate(Q('1.3'), { '1.3': { value: 'Lainnya' } })?.message).toMatch(/Lainnya/);
    expect(validate(Q('1.3'), { '1.3': { value: 'Lainnya', extra: { Lainnya: 'GM' } } })).toBeNull();
  });

  it('alokasi harus total 100%', () => {
    expect(validate(Q('2.2'), { '2.2': { 0: '50', 1: '30', 2: '10' } })?.message).toMatch(/90%/);
    expect(validate(Q('2.2'), { '2.2': { 0: '50', 1: '30', 2: '20' } })).toBeNull();
  });

  it('batas jumlah pilihan', () => {
    expect(validate(Q('3.7'), { '3.7': { values: ['a', 'b', 'c'] } })?.message).toMatch(/maksimal 2/);
  });

  it('matriks biasa: semua baris wajib dinilai', () => {
    expect(validate(Q('4.3'), { '4.3': { 0: 5 } })?.rows).toHaveLength(9);
  });

  it('tabel isian: baris setengah terisi ditolak, opt-out diterima', () => {
    const half: Answers = { '2.6': { rows: [{ kategori: 'Earthworks Equipment' }] } };
    expect(validate(Q('2.6'), half)?.cells?.[0]).toEqual(['tipe', 'kapasitas', 'tarif', 'satuan', 'operator', 'bbm']);
    expect(validate(Q('2.6'), { '2.6': { rows: [{}] } })?.message).toMatch(/minimal 1/);
    expect(validate(Q('2.6'), { '2.6': { rows: [{}], optOut: true } })).toBeNull();
    const full = { kategori: 'Earthworks Equipment', tipe: ['Excavator'], kapasitas: '20 T', tarif: '45000000', satuan: 'per bulan', operator: 'Ya', bbm: 'Tidak' };
    expect(validate(Q('2.6'), { '2.6': { rows: [full, {}] } })).toBeNull();
  });

  it('angka di luar batas ditolak', () => {
    const row = { jenis: 'Dump truck', jumlah: '2', proyek: 'X', provinsi: 'Bali', mulai: '2027-01', durasi: '12', jam: '900', status: 'Rencana' };
    expect(validate(Q('4.4'), { '4.4': { rows: [row] } })?.cells?.[0]).toEqual(['jam']);
  });
});

describe('matriks peringkat (nilai unik)', () => {
  const tidak: Answers = { '3.1': { value: 'Tidak menerima' } };

  it('3.2: kelima faktor harus diberi nilai 1–5 yang berbeda', () => {
    expect(validate(Q('3.2'), { ...tidak, '3.2': { 0: 5, 1: 4, 2: 3 } })?.message).toMatch(/belum dipakai: 1, 2/);
    expect(validate(Q('3.2'), { ...tidak, '3.2': { 0: 5, 1: 5, 2: 3, 3: 2, 4: 1 } })?.message).toMatch(/satu kali/);
    expect(validate(Q('3.2'), { ...tidak, '3.2': { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1 } })).toBeNull();
  });

  it('3.2: "Proses administrasi" ada di baris paling bawah', () => {
    const q = Q('3.2');
    if (q.type !== 'matrix') throw new Error('tipe salah');
    expect(String(q.rows[q.rows.length - 1])).toMatch(/^Proses administrasi/);
  });

  it('3.6: top 5 dari 7 aspek, dua aspek boleh kosong', () => {
    expect(validate(Q('3.6'), { '3.6': { 0: 5, 1: 4, 2: 3, 3: 2 } })?.message).toMatch(/belum dipakai: 1/);
    expect(validate(Q('3.6'), { '3.6': { 0: 5, 1: 4, 2: 3, 3: 2, 6: 1 } })).toBeNull();
    expect(answerText(Q('3.6'), { '3.6': { 6: 1, 0: 5 } })).toEqual([
      '5 — Tarif sewa kompetitif',
      '1 — Ketersediaan operator dan mekanik',
    ]);
  });
});

describe('logika lompat', () => {
  it('3.2 hanya untuk yang kurang/tidak menerima', () => {
    expect(validate(Q('3.2'), { '3.1': { value: 'Menerima' } })).toBeNull();
    expect(validate(Q('3.2'), { '3.1': { value: 'Tidak menerima' } })).not.toBeNull();
  });

  it('3.8–3.9 gugur bila hanya memilih subkon', () => {
    const subkon: Answers = { '3.7': { values: ['Subkon paket pekerjaan ke WKI'] } };
    const campur: Answers = { '3.7': { values: ['Subkon paket pekerjaan ke WKI', 'Sewa alat dengan operator'] } };
    expect(isVisible(Q('3.8'), subkon)).toBe(false);
    expect(isVisible(Q('3.9'), subkon)).toBe(false);
    expect(isVisible(Q('3.8'), campur)).toBe(true);
  });

  it('pertanyaan alat WKI (4.2, 5.3) hanya untuk pemakai alat WKI', () => {
    expect(isVisible(Q('4.2'), { '4.1': { value: 'Tidak' } })).toBe(false);
    expect(isVisible(Q('5.3'), { '4.1': { value: 'Tidak' } })).toBe(false);
    expect(isVisible(Q('4.2'), { '4.1': { value: 'Ya' } })).toBe(true);
    expect(isVisible(Q('5.3'), { '4.1': { value: 'Ya' } })).toBe(true);
  });

  it('jawaban pada pertanyaan yang dilewati tidak ikut terkirim', () => {
    const a: Answers = {
      '4.8': { values: ['Tidak ada'] },
      '4.9': { value: '< Rp10 miliar' },
    };
    const p = buildPayload(SURVEY, a, { id: '00000000-0000-4000-8000-000000000000', startedAt: null });
    expect(p.answers['4.9 Nilai paket subkon 2027']).toBeNull();
    expect(p.raw['4.9']).toBeUndefined();
  });

  it('data kirim memuat semua kolom dalam urutan kuesioner', () => {
    const p = buildPayload(SURVEY, {}, { id: 'x', startedAt: null });
    const keys = Object.keys(p.answers);
    expect(keys[0]).toBe('1.1 Nama');
    expect(keys[1]).toBe('1.2 Email');
    expect(keys[keys.length - 1]).toBe('6.1 Bersedia dihubungi kembali');
  });
});

describe('percabangan 2.6 (kelompok → tipe alat)', () => {
  const f = (Q('2.6') as RepeaterQ).fields.find((x) => x.id === 'tipe')!;

  it('tipe alat mengikuti kelompok yang dipilih', () => {
    expect(fieldOptions(f, {})).toEqual([]);
    expect(fieldOptions(f, { kategori: 'Light Equipment' })).toEqual(['Generating Set', 'Compressor', 'Lainnya']);
    expect(fieldOptions(f, { kategori: 'Earthworks Equipment' })).toContain('Motor Grader');
    expect(fieldOptions(f, { kategori: 'Earthworks Equipment' })).not.toContain('Dumptruck');
  });

  it('tipe "Lainnya" wajib disebutkan dan ikut terkirim', () => {
    const row = { kategori: 'Others Equipment', tipe: ['Pompa', 'Lainnya'], kapasitas: '4 inch', tarif: '1000000', satuan: 'per hari', operator: 'Tidak', bbm: 'Tidak' };
    expect(validate(Q('2.6'), { '2.6': { rows: [row] } })?.cells?.[0]).toEqual(['tipe']);
    const ok: Answers = { '2.6': { rows: [{ ...row, tipe__lainnya: 'Vibrator beton' }] } };
    expect(validate(Q('2.6'), ok)).toBeNull();
    const p = buildPayload(SURVEY, ok, { id: 'x', startedAt: null });
    expect(p.tables['2.6 Tarif vendor eksternal'][0]).toMatchObject({
      'Kelompok alat': 'Others Equipment',
      'Tipe alat': 'Pompa; Lainnya: Vibrator beton',
      'Kapasitas/spesifikasi': '4 inch',
    });
  });
});
