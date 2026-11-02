import { describe, expect, it } from 'vitest';
import { buildPayload, validate } from './logic';
import { SURVEY } from './survey';
import type { Answers, Question } from './types';

const Q = (num: string): Question => SURVEY.steps.flatMap((s) => s.questions).find((q) => q.num === num)!;

describe('validasi', () => {
  it('wajib diisi vs opsional', () => {
    expect(validate(Q('1.2'), {})?.message).toMatch(/wajib/);
    expect(validate(Q('1.1'), {})).toBeNull();
  });

  it('opsi "Lainnya" harus diisi', () => {
    expect(validate(Q('1.3'), { '1.3': { value: 'Lainnya' } })?.message).toMatch(/Lainnya/);
    expect(validate(Q('1.3'), { '1.3': { value: 'Lainnya', extra: { Lainnya: 'EPC' } } })).toBeNull();
  });

  it('alokasi harus total 100%', () => {
    expect(validate(Q('2.2'), { '2.2': { 0: '50', 1: '30', 2: '10' } })?.message).toMatch(/90%/);
    expect(validate(Q('2.2'), { '2.2': { 0: '50', 1: '30', 2: '20' } })).toBeNull();
  });

  it('batas jumlah pilihan', () => {
    expect(validate(Q('3.7'), { '3.7': { values: ['a', 'b', 'c'] } })?.message).toMatch(/maksimal 2/);
  });

  it('matriks: semua baris wajib dinilai', () => {
    const issue = validate(Q('3.6'), { '3.6': { 0: 5 } });
    expect(issue?.rows).toHaveLength(7);
  });

  it('tabel isian: baris setengah terisi ditolak, opt-out diterima', () => {
    const half: Answers = { '2.5': { rows: [{ jenis: 'Excavator 20 T' }] } };
    expect(validate(Q('2.5'), half)?.cells?.[0]).toEqual(['tarif', 'satuan', 'operator', 'bbm']);
    expect(validate(Q('2.5'), { '2.5': { rows: [{}] } })?.message).toMatch(/minimal 1/);
    expect(validate(Q('2.5'), { '2.5': { rows: [{}], optOut: true } })).toBeNull();
    const full = { jenis: 'Excavator 20 T', tarif: '45000000', satuan: 'per bulan', operator: 'Ya', bbm: 'Tidak' };
    expect(validate(Q('2.5'), { '2.5': { rows: [full, {}] } })).toBeNull();
  });

  it('angka di luar batas ditolak', () => {
    const row = { jenis: 'Dump truck', jumlah: '2', proyek: 'X', provinsi: 'Bali', mulai: '2027-01', durasi: '12', jam: '900', status: 'Rencana' };
    expect(validate(Q('4.2'), { '4.2': { rows: [row] } })?.cells?.[0]).toEqual(['jam']);
  });
});

describe('logika lompat', () => {
  it('3.2 hanya untuk yang kurang/tidak menerima', () => {
    expect(validate(Q('3.2'), { '3.1': { value: 'Menerima' } })).toBeNull();
    expect(validate(Q('3.2'), { '3.1': { value: 'Tidak menerima' } })).not.toBeNull();
  });

  it('jawaban pada pertanyaan yang dilewati tidak ikut terkirim', () => {
    const a: Answers = {
      '4.6': { values: ['Tidak ada'] },
      '4.7': { value: '< Rp10 miliar' },
      '4.9': { value: 'Tidak' },
      '4.10': { rows: [{ jenis: 'Vibro roller', jumlah: '1', lepas: '2027-06' }] },
    };
    const p = buildPayload(SURVEY, a, { id: '00000000-0000-4000-8000-000000000000', startedAt: null });
    expect(p.answers['4.7 Nilai paket subkon 2027']).toBeNull();
    expect(p.tables['4.10 Pelepasan alat WKI']).toEqual([]);
    expect(p.raw['4.7']).toBeUndefined();
  });

  it('data kirim memuat semua kolom dalam urutan kuesioner', () => {
    const p = buildPayload(SURVEY, {}, { id: 'x', startedAt: null });
    const keys = Object.keys(p.answers);
    expect(keys[0]).toBe('1.1 Nama');
    expect(keys).toContain('3.6 Biaya mobilisasi');
    expect(keys[keys.length - 1]).toBe('5.8 Bersedia diwawancara');
  });
});
