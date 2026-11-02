// Bentuk data kuesioner dan jawaban.

/** Opsi pilihan. Bentuk objek menampilkan kolom isian tambahan saat dipilih ("Lainnya: ___"). */
export type Option = string | { label: string; input: string };

export type Answers = Record<string, Answer | undefined>;

interface Base {
  /** Nomor pertanyaan, juga dipakai sebagai kunci jawaban dan nama kolom data. */
  num: string;
  title: string;
  /** Judul singkat untuk nama kolom dan ringkasan. */
  short?: string;
  hint?: string;
  required?: boolean;
  /** Logika lompat: pertanyaan hanya tampil (dan hanya dinilai/dikirim) bila bernilai true. */
  showIf?: (a: Answers) => boolean;
}

export interface TextQ extends Base {
  type: 'text' | 'textarea';
  placeholder?: string;
  autocomplete?: string;
}
export interface RadioQ extends Base {
  type: 'radio';
  options: Option[];
}
export interface CheckboxQ extends Base {
  type: 'checkbox';
  options: Option[];
  /** Batas jumlah pilihan. */
  max?: number;
  /** Opsi yang tidak boleh digabung dengan opsi lain (mis. "Tidak ada"). */
  exclusive?: string[];
}
export interface ScaleQ extends Base {
  type: 'scale';
  min: number;
  max: number;
  /** Label untuk tiap titik skala (opsional). */
  labels?: string[];
  minLabel?: string;
  maxLabel?: string;
}
export interface MatrixRow {
  label: string;
  hint?: string;
}
export interface MatrixQ extends Base {
  type: 'matrix';
  /** Label skala 1..n. */
  labels: string[];
  rows: (string | MatrixRow)[];
}
export interface AllocationQ extends Base {
  type: 'allocation';
  rows: string[];
}

export type FieldType = 'text' | 'currency' | 'int' | 'select' | 'yesno' | 'month';
export interface Field {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
  years?: number[];
  /** Lebar penuh di dalam kartu baris. */
  wide?: boolean;
}
export interface RepeaterQ extends Base {
  type: 'repeater';
  /** Nama tabel saat diekspor. */
  tableName: string;
  itemLabel: string;
  fields: Field[];
  initialRows: number;
  maxRows: number;
  /** Minimal jumlah baris lengkap (berlaku bila wajib). */
  minFilled: number;
  /** Teks pilihan "tidak berlaku" — bila dicentang, tabel tidak perlu diisi. */
  optOut?: string;
  example?: string;
}

export type Question = TextQ | RadioQ | CheckboxQ | ScaleQ | MatrixQ | AllocationQ | RepeaterQ;

export interface Step {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  questions: Question[];
}

export interface Survey {
  org: string;
  title: string;
  subtitle: string;
  version: string;
  duration: string;
  intro: {
    lead: string;
    goals: { icon: IconName; title: string; text: string }[];
    privacy: string;
    thanks: string;
  };
  steps: Step[];
}

export type IconName = 'gauge' | 'handshake' | 'calendar' | 'wrench';

// ── Jawaban per tipe ──────────────────────────────────────────────
export type Row = Record<string, string>;
export type Answer =
  | string // text, textarea
  | number // scale
  | ChoiceAnswer // radio
  | MultiAnswer // checkbox
  | Record<string, number> // matrix: indeks baris → nilai
  | Record<string, string> // allocation: indeks baris → persen
  | RepeaterAnswer;

export interface ChoiceAnswer {
  value: string;
  extra?: Record<string, string>;
}
export interface MultiAnswer {
  values: string[];
  extra?: Record<string, string>;
}
export interface RepeaterAnswer {
  rows: Row[];
  optOut?: boolean;
}
