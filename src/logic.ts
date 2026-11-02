// Logika murni (tanpa React): visibilitas, validasi, dan penyusunan data kirim.
import type {
  AllocationQ, Answer, Answers, ChoiceAnswer, Field, MatrixQ, MatrixRow, MultiAnswer,
  Option, Question, RepeaterAnswer, RepeaterQ, Row, Survey,
} from './types';

export const optLabel = (o: Option) => (typeof o === 'string' ? o : o.label);
export const optInput = (o: Option) => (typeof o === 'string' ? undefined : o.input);
export const rowOf = (r: string | MatrixRow): MatrixRow => (typeof r === 'string' ? { label: r } : r);
export const header = (q: Question) => `${q.num} ${q.short ?? q.title}`;

export const isVisible = (q: Question, a: Answers) => !q.showIf || q.showIf(a);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const MONTH_NAMES = MONTHS;

export const formatRupiah = (digits: string) =>
  digits ? Number(digits).toLocaleString('id-ID') : '';

/** "2027-03" → "Mar 2027" */
export const formatMonth = (v: string) => {
  const [y, m] = v.split('-');
  return y && m ? `${MONTHS[Number(m) - 1]} ${y}` : '';
};

export function emptyRepeater(q: RepeaterQ): RepeaterAnswer {
  return { rows: Array.from({ length: q.initialRows }, () => ({})) };
}

// ── Validasi ─────────────────────────────────────────────────────

export interface Issue {
  message: string;
  /** Indeks baris matriks/alokasi yang belum diisi atau salah. */
  rows?: number[];
  /** Repeater: baris → daftar id kolom yang bermasalah. */
  cells?: Record<number, string[]>;
}

const blank = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

/** Kunci isian "Lainnya" untuk kolom 'checks'. */
export const otherKey = (f: Field) => `${f.id}__lainnya`;
export const LAINNYA = 'Lainnya';

/** Opsi kolom 'checks' sesuai jawaban kolom induknya (kosong bila induk belum dipilih). */
export function fieldOptions(f: Field, r: Row): string[] {
  if (!f.dependsOn || !f.optionsBy) return f.options ?? [];
  const parent = r[f.dependsOn];
  const opts = typeof parent === 'string' ? f.optionsBy[parent] ?? [] : [];
  return parent && f.other ? [...opts, LAINNYA] : opts;
}

function extraIssue(opts: Option[], chosen: string[], extra: Record<string, string> | undefined): Issue | null {
  for (const o of opts) {
    const label = optLabel(o);
    if (optInput(o) && chosen.includes(label) && blank(extra?.[label])) {
      return { message: `Lengkapi isian untuk "${label}".` };
    }
  }
  return null;
}

export function fieldIssue(f: Field, v: string | string[] | undefined, r: Row = {}): string | null {
  if (blank(v)) return f.optional ? null : 'wajib';
  if (f.type === 'checks') {
    const list = Array.isArray(v) ? v : [];
    if (list.includes(LAINNYA) && blank(r[otherKey(f)])) return 'isi tipe lainnya';
    return null;
  }
  if (Array.isArray(v)) return 'tidak valid';
  if (f.type === 'int') {
    const n = Number(v);
    if (!Number.isInteger(n)) return 'harus angka bulat';
    if (f.min !== undefined && n < f.min) return `minimal ${f.min}`;
    if (f.max !== undefined && n > f.max) return `maksimal ${f.max}`;
  }
  if (f.type === 'currency' && !(Number(v) > 0)) return 'harus lebih dari 0';
  if (f.type === 'month' && !/^\d{4}-\d{2}$/.test(v!)) return 'pilih bulan dan tahun';
  return null;
}

export const rowIsEmpty = (q: RepeaterQ, r: Row) => q.fields.every((f) => blank(r[f.id]));

const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export function validate(q: Question, a: Answers): Issue | null {
  if (!isVisible(q, a)) return null;
  const v = a[q.num];

  switch (q.type) {
    case 'text':
    case 'textarea':
      if (blank(v)) return q.required ? { message: 'Pertanyaan ini wajib diisi.' } : null;
      if (q.format === 'email' && !EMAIL.test(String(v).trim())) {
        return { message: 'Periksa kembali alamat email, contoh: nama@contoh.co.id.' };
      }
      return null;

    case 'radio': {
      const ans = v as ChoiceAnswer | undefined;
      if (!ans?.value) return q.required ? { message: 'Pilih salah satu jawaban.' } : null;
      return extraIssue(q.options, [ans.value], ans.extra);
    }

    case 'checkbox': {
      const ans = v as MultiAnswer | undefined;
      const values = ans?.values ?? [];
      if (values.length === 0) return q.required ? { message: 'Pilih minimal satu jawaban.' } : null;
      if (q.max && values.length > q.max) return { message: `Pilih maksimal ${q.max} jawaban.` };
      return extraIssue(q.options, values, ans?.extra);
    }

    case 'scale':
      return q.required && typeof v !== 'number' ? { message: 'Pilih salah satu nilai.' } : null;

    case 'matrix': {
      const ans = (v ?? {}) as Record<string, number>;
      if (q.unique) return uniqueIssue(q, ans);
      const missing = q.rows.map((_, i) => i).filter((i) => typeof ans[i] !== 'number');
      if (!q.required || missing.length === 0) return null;
      return {
        message: missing.length === q.rows.length
          ? 'Beri nilai untuk setiap baris.'
          : `Masih ada ${missing.length} baris yang belum dinilai.`,
        rows: missing,
      };
    }

    case 'allocation': {
      const ans = (v ?? {}) as Record<string, string>;
      const total = allocationTotal(q, ans);
      const allBlank = q.rows.every((_, i) => blank(ans[i]));
      if (allBlank) return q.required ? { message: 'Isi porsi masing-masing sumber alat (total 100%).' } : null;
      const bad = q.rows.map((_, i) => i).filter((i) => Number(ans[i] || 0) > 100);
      if (bad.length) return { message: 'Porsi per baris tidak boleh lebih dari 100%.', rows: bad };
      if (total !== 100) return { message: `Total harus 100% (saat ini ${total}%).` };
      return null;
    }

    case 'repeater': {
      const ans = (v as RepeaterAnswer | undefined) ?? { rows: [] };
      if (ans.optOut) return null;
      const cells: Record<number, string[]> = {};
      let complete = 0;
      ans.rows.forEach((r, i) => {
        if (rowIsEmpty(q, r)) return;
        const bad = q.fields.filter((f) => fieldIssue(f, r[f.id], r)).map((f) => f.id);
        if (bad.length) cells[i] = bad;
        else complete++;
      });
      const badRows = Object.keys(cells).map(Number);
      if (badRows.length) {
        const first = badRows[0];
        const names = cells[first].map((id) => q.fields.find((f) => f.id === id)!.label.toLowerCase());
        return {
          message: `${q.itemLabel} ${first + 1} belum lengkap/benar: ${names.join(', ')}.` +
            (badRows.length > 1 ? ` (${badRows.length} baris perlu diperiksa)` : ''),
          cells,
        };
      }
      if (q.required && complete < Math.max(q.minFilled, 1)) {
        return {
          message: q.optOut
            ? `Isi minimal ${Math.max(q.minFilled, 1)} ${q.itemLabel.toLowerCase()}, atau centang "${q.optOut}".`
            : `Isi minimal ${Math.max(q.minFilled, 1)} ${q.itemLabel.toLowerCase()}.`,
        };
      }
      return null;
    }
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Matriks peringkat: setiap nilai dipakai sekali; bila wajib, semua nilai harus terpakai. */
function uniqueIssue(q: MatrixQ, ans: Record<string, number>): Issue | null {
  const used = q.rows.map((_, i) => ans[i]).filter((x): x is number => typeof x === 'number');
  if (new Set(used).size !== used.length) return { message: 'Setiap nilai hanya boleh dipakai satu kali.' };
  if (!q.required) return null;
  const unusedVals = q.labels.map((_, i) => i + 1).filter((n) => !used.includes(n));
  if (!unusedVals.length) return null;
  const rows = q.rows.length <= q.labels.length
    ? q.rows.map((_, i) => i).filter((i) => typeof ans[i] !== 'number')
    : undefined;
  return {
    message: used.length === 0
      ? `Beri nilai 1–${q.labels.length}, masing-masing satu kali.`
      : `Nilai yang belum dipakai: ${unusedVals.join(', ')}.`,
    rows,
  };
}

export function allocationTotal(q: AllocationQ, ans: Record<string, string>) {
  return q.rows.reduce((s, _, i) => s + (Number(ans[i]) || 0), 0);
}

export function validateStep(qs: Question[], a: Answers): Map<string, Issue> {
  const out = new Map<string, Issue>();
  for (const q of qs) {
    const issue = validate(q, a);
    if (issue) out.set(q.num, issue);
  }
  return out;
}

// ── Format jawaban (ringkasan & data kirim) ─────────────────────

function withExtra(label: string, opts: Option[], extra?: Record<string, string>) {
  const o = opts.find((x) => optLabel(x) === label);
  const e = o && optInput(o) ? extra?.[label]?.trim() : '';
  return e ? `${label}: ${e}` : label;
}

export function fieldText(f: Field, v: string | string[] | undefined, r: Row = {}, sep = ', '): string {
  if (blank(v)) return '';
  if (Array.isArray(v)) {
    const other = str(r[otherKey(f)])?.trim();
    return v.map((x) => (x === LAINNYA && other ? `${LAINNYA}: ${other}` : x)).join(sep);
  }
  switch (f.type) {
    case 'currency': return `Rp${formatRupiah(v!)}`;
    case 'month': return formatMonth(v!);
    case 'int': return f.suffix ? `${v} ${f.suffix}` : v!;
    default: return v!;
  }
}

export function repeaterRows(q: RepeaterQ, ans: RepeaterAnswer | undefined): Row[] {
  if (!ans || ans.optOut) return [];
  return ans.rows.filter((r) => !rowIsEmpty(q, r));
}

/** Teks jawaban yang mudah dibaca, untuk ringkasan. `null` = belum dijawab. */
export function answerText(q: Question, a: Answers): string | string[] | null {
  const v = a[q.num];
  switch (q.type) {
    case 'text':
    case 'textarea':
      return blank(v) ? null : String(v).trim();
    case 'radio': {
      const ans = v as ChoiceAnswer | undefined;
      return ans?.value ? withExtra(ans.value, q.options, ans.extra) : null;
    }
    case 'checkbox': {
      const ans = v as MultiAnswer | undefined;
      return ans?.values?.length ? ans.values.map((x) => withExtra(x, q.options, ans.extra)) : null;
    }
    case 'scale':
      if (typeof v !== 'number') return null;
      return q.labels ? `${v} — ${q.labels[v - q.min]}` : String(v);
    case 'matrix': {
      const ans = (v ?? {}) as Record<string, number>;
      if (!Object.keys(ans).length) return null;
      if (q.unique) {
        // Urutkan dari nilai tertinggi; baris tanpa nilai tidak ditampilkan
        return q.rows
          .map((r, i) => ({ label: rowOf(r).label, v: ans[i] }))
          .filter((x) => typeof x.v === 'number')
          .sort((x, y) => y.v - x.v)
          .map((x) => `${x.v} — ${x.label}`);
      }
      return q.rows.map((r, i) => `${rowOf(r).label}: ${typeof ans[i] === 'number' ? `${ans[i]} — ${q.labels[ans[i] - 1]}` : '–'}`);
    }
    case 'allocation': {
      const ans = (v ?? {}) as Record<string, string>;
      if (q.rows.every((_, i) => blank(ans[i]))) return null;
      return q.rows.map((r, i) => `${r}: ${Number(ans[i]) || 0}%`);
    }
    case 'repeater': {
      const ans = v as RepeaterAnswer | undefined;
      if (ans?.optOut && q.optOut) return q.optOut;
      const rows = repeaterRows(q, ans);
      if (!rows.length) return null;
      return rows.map((r) => q.fields.map((f) => fieldText(f, r[f.id], r)).filter(Boolean).join(' · '));
    }
  }
}

// ── Data kirim ──────────────────────────────────────────────────

export type Cell = string | number | null;
export interface Payload {
  id: string;
  version: string;
  startedAt: string | null;
  submittedAt: string;
  durationMinutes: number | null;
  /** Satu kolom per jawaban, urut sesuai kuesioner. */
  answers: Record<string, Cell>;
  /** Tabel isian berulang: satu baris per alat. */
  tables: Record<string, Record<string, Cell>[]>;
  /** Jawaban mentah, untuk cadangan. */
  raw: Answers;
}

function flatten(q: Question, a: Answers, out: Record<string, Cell>, tables: Payload['tables']) {
  const v = a[q.num];
  const h = header(q);
  switch (q.type) {
    case 'text':
    case 'textarea':
    case 'radio':
    case 'checkbox': {
      const t = answerText(q, a);
      out[h] = t === null ? null : Array.isArray(t) ? t.join('; ') : t;
      return;
    }
    case 'scale':
      out[h] = typeof v === 'number' ? v : null;
      return;
    case 'matrix': {
      const ans = (v ?? {}) as Record<string, number>;
      q.rows.forEach((r, i) => { out[`${q.num} ${rowOf(r).label}`] = typeof ans[i] === 'number' ? ans[i] : null; });
      return;
    }
    case 'allocation': {
      const ans = (v ?? {}) as Record<string, string>;
      q.rows.forEach((r, i) => { out[`${q.num} ${r} (%)`] = blank(ans[i]) ? null : Number(ans[i]); });
      return;
    }
    case 'repeater': {
      const ans = v as RepeaterAnswer | undefined;
      const rows = repeaterRows(q, ans);
      out[h] = ans?.optOut && q.optOut ? q.optOut : rows.length ? `${rows.length} ${q.itemLabel.toLowerCase()}` : null;
      tables[`${q.num} ${q.tableName}`] = rows.map((r) =>
        Object.fromEntries(q.fields.map((f): [string, Cell] => {
          const x = r[f.id];
          const col = f.column ?? f.label;
          if (blank(x)) return [col, null];
          if (f.type === 'int' || f.type === 'currency') return [col, Number(x)];
          if (Array.isArray(x)) return [col, fieldText(f, x, r, '; ')];
          return [col, x as string];
        })),
      );
      return;
    }
  }
}

export function buildPayload(survey: Survey, a: Answers, meta: { id: string; startedAt: string | null }): Payload {
  const answers: Payload['answers'] = {};
  const tables: Payload['tables'] = {};
  const raw: Answers = {};
  for (const step of survey.steps) {
    for (const q of step.questions) {
      if (!isVisible(q, a)) {
        // Pertanyaan yang dilewati (logika lompat) tetap punya kolom, tapi kosong.
        if (q.type === 'repeater') tables[`${q.num} ${q.tableName}`] = [];
        else if (q.type === 'matrix') q.rows.forEach((r) => { answers[`${q.num} ${rowOf(r).label}`] = null; });
        else if (q.type === 'allocation') q.rows.forEach((r) => { answers[`${q.num} ${r} (%)`] = null; });
        else answers[header(q)] = null;
        continue;
      }
      flatten(q, a, answers, tables);
      if (a[q.num] !== undefined) raw[q.num] = a[q.num] as Answer;
    }
  }
  const now = new Date();
  const started = meta.startedAt ? new Date(meta.startedAt) : null;
  return {
    id: meta.id,
    version: survey.version,
    startedAt: meta.startedAt,
    submittedAt: now.toISOString(),
    durationMinutes: started ? Math.max(0, Math.round((now.getTime() - started.getTime()) / 6000) / 10) : null,
    answers,
    tables,
    raw,
  };
}
