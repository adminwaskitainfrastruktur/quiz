// Komponen isian untuk setiap tipe pertanyaan.
import { useId } from 'react';
import {
  allocationTotal, emptyRepeater, formatRupiah, Issue, MONTH_NAMES, optInput, optLabel, rowOf,
} from '../logic';
import type {
  AllocationQ, ChoiceAnswer, CheckboxQ, Field, MatrixQ, MultiAnswer, RadioQ, RepeaterAnswer,
  RepeaterQ, Row, ScaleQ, TextQ,
} from '../types';

const digits = (s: string, max: number) => s.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, max);

// ── Isian teks ───────────────────────────────────────────────────
export function TextInput({ q, value, onChange, labelledBy }: {
  q: TextQ; value: string | undefined; onChange: (v: string) => void; labelledBy: string;
}) {
  const common = {
    className: 'input',
    value: value ?? '',
    placeholder: q.placeholder,
    'aria-labelledby': labelledBy,
    'aria-required': q.required || undefined,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };
  return q.type === 'textarea'
    ? <textarea {...common} rows={4} maxLength={4000} />
    : <input {...common} type="text" maxLength={300} autoComplete={q.autocomplete ?? 'off'} />;
}

// ── Pilih satu / pilih beberapa ─────────────────────────────────
export function RadioGroup({ q, value, onChange, labelledBy }: {
  q: RadioQ; value: ChoiceAnswer | undefined; onChange: (v: ChoiceAnswer) => void; labelledBy: string;
}) {
  const name = useId();
  return (
    <div className="choices" role="radiogroup" aria-labelledby={labelledBy}>
      {q.options.map((o) => {
        const label = optLabel(o);
        const checked = value?.value === label;
        const extra = optInput(o);
        return (
          <div className={`choice${checked ? ' is-on' : ''}`} key={label}>
            <label className="choice-row">
              <input
                type="radio" name={name} checked={checked}
                onChange={() => onChange({ value: label, extra: value?.extra })}
              />
              <span className="mark mark-radio" aria-hidden="true" />
              <span className="choice-text">{label}</span>
            </label>
            {extra && checked && (
              <input
                className="input choice-extra" type="text" maxLength={200} autoFocus
                placeholder={extra} aria-label={`${label}: ${extra}`}
                value={value?.extra?.[label] ?? ''}
                onChange={(e) => onChange({ value: label, extra: { ...value?.extra, [label]: e.target.value } })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CheckboxGroup({ q, value, onChange, labelledBy }: {
  q: CheckboxQ; value: MultiAnswer | undefined; onChange: (v: MultiAnswer) => void; labelledBy: string;
}) {
  const values = value?.values ?? [];
  const exclusive = q.exclusive ?? [];
  const full = !!q.max && values.length >= q.max;

  const toggle = (label: string, on: boolean) => {
    let next = values.filter((x) => x !== label);
    if (on) next = exclusive.includes(label) ? [label] : [...next.filter((x) => !exclusive.includes(x)), label];
    onChange({ values: next, extra: value?.extra });
  };

  return (
    <div className="choices" role="group" aria-labelledby={labelledBy}>
      {q.max && (
        <p className={`counter${full ? ' is-full' : ''}`} aria-live="polite">
          {values.length} dari maks. {q.max} dipilih
        </p>
      )}
      {q.options.map((o) => {
        const label = optLabel(o);
        const checked = values.includes(label);
        const extra = optInput(o);
        const disabled = !checked && full && !exclusive.includes(label);
        return (
          <div className={`choice${checked ? ' is-on' : ''}${disabled ? ' is-off' : ''}`} key={label}>
            <label className="choice-row">
              <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => toggle(label, e.target.checked)} />
              <span className="mark mark-check" aria-hidden="true" />
              <span className="choice-text">{label}</span>
            </label>
            {extra && checked && (
              <input
                className="input choice-extra" type="text" maxLength={200} autoFocus
                placeholder={extra} aria-label={`${label}: ${extra}`}
                value={value?.extra?.[label] ?? ''}
                onChange={(e) => onChange({ values, extra: { ...value?.extra, [label]: e.target.value } })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Skala angka ──────────────────────────────────────────────────
export function Scale({ q, value, onChange, labelledBy }: {
  q: ScaleQ; value: number | undefined; onChange: (v: number) => void; labelledBy: string;
}) {
  const name = useId();
  const points = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i);
  const wide = points.length > 5;
  return (
    <div className="scale-wrap">
      <div className={`scale${wide ? ' scale-wide' : ''}`} role="radiogroup" aria-labelledby={labelledBy}
        style={{ ['--n' as string]: points.length }}>
        {points.map((p, i) => (
          <label className={`pill${value === p ? ' is-on' : ''}`} key={p}>
            <input
              type="radio" name={name} checked={value === p} onChange={() => onChange(p)}
              aria-label={q.labels ? `${p} – ${q.labels[i]}` : String(p)}
            />
            <span className="pill-num">{p}</span>
            {q.labels && <span className="pill-label">{q.labels[i]}</span>}
          </label>
        ))}
      </div>
      {(q.minLabel || q.maxLabel) && (
        <div className="scale-ends" aria-hidden="true">
          <span>{q.min} = {q.minLabel}</span>
          <span>{q.max} = {q.maxLabel}</span>
        </div>
      )}
      {q.labels && typeof value === 'number' && (
        <p className="scale-picked" aria-hidden="true">Dipilih: {value} — {q.labels[value - q.min]}</p>
      )}
    </div>
  );
}

// ── Matriks penilaian ────────────────────────────────────────────
export function Matrix({ q, value, onChange, labelledBy, issue }: {
  q: MatrixQ; value: Record<string, number> | undefined; onChange: (v: Record<string, number>) => void;
  labelledBy: string; issue: Issue | null;
}) {
  const base = useId();
  const ans = value ?? {};
  const missing = new Set(issue?.rows ?? []);
  return (
    <div className="matrix" role="group" aria-labelledby={labelledBy}>
      <ol className="legend" aria-label="Keterangan skala">
        {q.labels.map((l, i) => <li key={l}><b>{i + 1}</b> {l}</li>)}
      </ol>
      <div className="matrix-head" aria-hidden="true">
        <span />
        {q.labels.map((l, i) => <span key={l}><b>{i + 1}</b>{l}</span>)}
      </div>
      {q.rows.map((r, ri) => {
        const row = rowOf(r);
        const id = `${base}-${ri}`;
        const v = ans[ri];
        return (
          <div className={`matrix-row${missing.has(ri) ? ' is-missing' : ''}${typeof v === 'number' ? ' is-done' : ''}`} key={row.label}>
            <div className="matrix-label" id={id}>
              <span>{row.label}</span>
              {row.hint && <small>{row.hint}</small>}
            </div>
            <div className="matrix-pills" role="radiogroup" aria-labelledby={id}>
              {q.labels.map((l, i) => (
                <label className={`pill${v === i + 1 ? ' is-on' : ''}`} key={l}>
                  <input type="radio" name={id} checked={v === i + 1} aria-label={`${i + 1} – ${l}`}
                    onChange={() => onChange({ ...ans, [ri]: i + 1 })} />
                  <span className="pill-num">{i + 1}</span>
                </label>
              ))}
            </div>
            {typeof v === 'number' && <p className="matrix-picked" aria-hidden="true">{q.labels[v - 1]}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Alokasi persen ───────────────────────────────────────────────
export function Allocation({ q, value, onChange, labelledBy }: {
  q: AllocationQ; value: Record<string, string> | undefined; onChange: (v: Record<string, string>) => void;
  labelledBy: string;
}) {
  const base = useId();
  const ans = value ?? {};
  const total = allocationTotal(q, ans);
  const state = total === 100 ? 'ok' : total > 100 ? 'over' : 'under';
  return (
    <div className="alloc" role="group" aria-labelledby={labelledBy}>
      {q.rows.map((r, i) => (
        <div className="alloc-row" key={r}>
          <label htmlFor={`${base}-${i}`}>{r}</label>
          <div className="affix">
            <input
              id={`${base}-${i}`} className="input input-num" type="text" inputMode="numeric" placeholder="0"
              value={ans[i] ?? ''} onChange={(e) => onChange({ ...ans, [i]: digits(e.target.value, 3) })}
            />
            <span className="affix-text">%</span>
          </div>
        </div>
      ))}
      <div className={`alloc-total is-${state}`} aria-live="polite">
        <div className="alloc-bar"><span style={{ width: `${Math.min(total, 100)}%` }} /></div>
        <p>
          Total <b>{total}%</b>
          {state === 'ok' ? ' — pas' : state === 'over' ? ` — kelebihan ${total - 100}%` : ` — kurang ${100 - total}%`}
        </p>
      </div>
    </div>
  );
}

// ── Tabel isian berulang ─────────────────────────────────────────
function FieldInput({ f, value, onChange, id, invalid }: {
  f: Field; value: string | undefined; onChange: (v: string) => void; id: string; invalid: boolean;
}) {
  const v = value ?? '';
  const inv = invalid || undefined;
  switch (f.type) {
    case 'text':
      return <input id={id} className="input" type="text" maxLength={200} placeholder={f.placeholder} value={v}
        aria-invalid={inv} onChange={(e) => onChange(e.target.value)} />;
    case 'currency':
      return (
        <div className="affix affix-pre">
          <span className="affix-text">Rp</span>
          <input id={id} className="input input-num" type="text" inputMode="numeric" placeholder={f.placeholder}
            value={formatRupiah(v)} aria-invalid={inv} onChange={(e) => onChange(digits(e.target.value, 15))} />
        </div>
      );
    case 'int':
      return (
        <div className="affix">
          <input id={id} className="input input-num" type="text" inputMode="numeric" value={v} aria-invalid={inv}
            onChange={(e) => onChange(digits(e.target.value, 4))} />
          {f.suffix && <span className="affix-text">{f.suffix}</span>}
        </div>
      );
    case 'select':
      return (
        <select id={id} className="input select" value={v} aria-invalid={inv} onChange={(e) => onChange(e.target.value)}>
          <option value="">Pilih…</option>
          {f.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case 'yesno':
      return (
        <div className="yesno" role="radiogroup" aria-labelledby={`${id}-l`}>
          {['Ya', 'Tidak'].map((o) => (
            <label key={o} className={`pill pill-text${v === o ? ' is-on' : ''}`}>
              <input type="radio" name={id} checked={v === o} onChange={() => onChange(o)} />
              <span className="pill-num">{o}</span>
            </label>
          ))}
        </div>
      );
    case 'month': {
      const [y = '', m = ''] = v.split('-');
      const set = (ny: string, nm: string) => onChange(ny || nm ? `${ny}-${nm}` : '');
      return (
        <div className="month">
          <select id={id} className="input select" value={m} aria-label={`${f.label}: bulan`} aria-invalid={inv}
            onChange={(e) => set(y, e.target.value)}>
            <option value="">Bulan</option>
            {MONTH_NAMES.map((n, i) => <option key={n} value={String(i + 1).padStart(2, '0')}>{n}</option>)}
          </select>
          <select className="input select" value={y} aria-label={`${f.label}: tahun`} aria-invalid={inv}
            onChange={(e) => set(e.target.value, m)}>
            <option value="">Tahun</option>
            {(f.years ?? []).map((yr) => <option key={yr}>{yr}</option>)}
          </select>
        </div>
      );
    }
  }
}

export function Repeater({ q, value, onChange, labelledBy, issue }: {
  q: RepeaterQ; value: RepeaterAnswer | undefined; onChange: (v: RepeaterAnswer) => void;
  labelledBy: string; issue: Issue | null;
}) {
  const base = useId();
  const ans = value ?? emptyRepeater(q);
  const setRow = (i: number, row: Row) => onChange({ ...ans, rows: ans.rows.map((r, j) => (j === i ? row : r)) });
  const canAdd = ans.rows.length < q.maxRows;

  return (
    <div className="repeater" role="group" aria-labelledby={labelledBy}>
      {q.optOut && (
        <label className={`choice choice-row optout${ans.optOut ? ' is-on' : ''}`}>
          <input type="checkbox" checked={!!ans.optOut} onChange={(e) => onChange({ ...ans, optOut: e.target.checked })} />
          <span className="mark mark-check" aria-hidden="true" />
          <span className="choice-text">{q.optOut}</span>
        </label>
      )}
      {!ans.optOut && (
        <>
          {q.example && <p className="example"><span>Contoh</span>{q.example}</p>}
          {ans.rows.map((row, i) => {
            const bad = new Set(issue?.cells?.[i] ?? []);
            return (
              <fieldset className={`rcard${bad.size ? ' is-missing' : ''}`} key={i}>
                <legend className="rcard-head">
                  <span>{q.itemLabel} {i + 1}</span>
                </legend>
                {ans.rows.length > 1 && (
                  <button type="button" className="link-btn rcard-remove"
                    onClick={() => onChange({ ...ans, rows: ans.rows.filter((_, j) => j !== i) })}>
                    Hapus
                  </button>
                )}
                <div className="rgrid">
                  {q.fields.map((f) => {
                    const id = `${base}-${i}-${f.id}`;
                    return (
                      <div className={`rfield${f.wide ? ' is-wide' : ''}${bad.has(f.id) ? ' is-missing' : ''}`} key={f.id}>
                        <label className="rlabel" htmlFor={id} id={`${id}-l`}>{f.label}</label>
                        <FieldInput f={f} id={id} value={row[f.id]} invalid={bad.has(f.id)}
                          onChange={(v) => setRow(i, { ...row, [f.id]: v })} />
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          {canAdd ? (
            <button type="button" className="btn btn-ghost add-btn" onClick={() => onChange({ ...ans, rows: [...ans.rows, {}] })}>
              <span aria-hidden="true">＋</span> Tambah {q.itemLabel.toLowerCase()}
            </button>
          ) : (
            <p className="muted small">Maksimal {q.maxRows} {q.itemLabel.toLowerCase()}.</p>
          )}
        </>
      )}
    </div>
  );
}
