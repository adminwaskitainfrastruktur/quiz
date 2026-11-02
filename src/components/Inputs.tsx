// Komponen isian untuk setiap tipe pertanyaan.
import { useId } from 'react';
import {
  allocationTotal, emptyRepeater, fieldOptions, formatRupiah, Issue, LAINNYA, MONTH_NAMES, optInput, optLabel,
  otherKey, rowOf,
} from '../logic';
import { EquipmentArt } from './Art';
import type {
  AllocationQ, ChoiceAnswer, CheckboxQ, Field, MatrixQ, MultiAnswer, RadioQ, RepeaterAnswer,
  RepeaterQ, Row, ScaleQ, TextQ,
} from '../types';

/** Huruf pintasan keyboard untuk opsi ke-i (A, B, C, …). */
export const keyOf = (i: number) => String.fromCharCode(65 + i);

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
    : <input {...common} type={q.format === 'email' ? 'email' : 'text'} inputMode={q.format === 'email' ? 'email' : undefined}
        maxLength={300} autoComplete={q.autocomplete ?? 'off'} spellCheck={q.format === 'email' ? false : undefined} />;
}

// ── Pilih satu / pilih beberapa ─────────────────────────────────
export function RadioGroup({ q, value, onChange, labelledBy }: {
  q: RadioQ; value: ChoiceAnswer | undefined; onChange: (v: ChoiceAnswer) => void; labelledBy: string;
}) {
  const name = useId();
  if (q.dropdown) {
    const chosen = q.options.find((o) => optLabel(o) === value?.value);
    const extra = chosen && optInput(chosen);
    return (
      <div className="dropdown">
        <select className="input select" aria-labelledby={labelledBy} aria-required={q.required || undefined}
          value={value?.value ?? ''} onChange={(e) => onChange({ value: e.target.value, extra: value?.extra })}>
          <option value="" disabled>Pilih…</option>
          {q.options.map((o) => <option key={optLabel(o)}>{optLabel(o)}</option>)}
        </select>
        {extra && (
          <input
            className="input choice-extra-dd" type="text" maxLength={200} autoFocus
            placeholder={extra} aria-label={`${value!.value}: ${extra}`}
            value={value?.extra?.[value!.value] ?? ''}
            onChange={(e) => onChange({ value: value!.value, extra: { ...value?.extra, [value!.value]: e.target.value } })}
          />
        )}
      </div>
    );
  }
  return (
    <div className="choices" role="radiogroup" aria-labelledby={labelledBy}>
      {q.options.map((o, i) => {
        const label = optLabel(o);
        const checked = value?.value === label;
        const extra = optInput(o);
        return (
          <div className={`choice${checked ? ' is-on' : ''}`} key={label} style={{ ['--i' as string]: i }}>
            <label className="choice-row">
              <input
                type="radio" name={name} checked={checked}
                onChange={() => onChange({ value: label, extra: value?.extra })}
              />
              <span className="key" aria-hidden="true">{keyOf(i)}</span>
              <span className="choice-text">{label}</span>
              <span className="tick" aria-hidden="true" />
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
      {q.options.map((o, i) => {
        const label = optLabel(o);
        const checked = values.includes(label);
        const extra = optInput(o);
        const disabled = !checked && full && !exclusive.includes(label);
        return (
          <div className={`choice${checked ? ' is-on' : ''}${disabled ? ' is-off' : ''}`} key={label} style={{ ['--i' as string]: i }}>
            <label className="choice-row">
              <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => toggle(label, e.target.checked)} />
              <span className="key" aria-hidden="true">{keyOf(i)}</span>
              <span className="choice-text">{label}</span>
              <span className="tick" aria-hidden="true" />
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
  // Peringkat: nilai yang dipilih dipindahkan dari baris lain yang memakainya
  const pick = (ri: number, val: number) => {
    const next: Record<string, number> = { ...ans, [ri]: val };
    if (q.unique) {
      for (const k of Object.keys(next)) if (Number(k) !== ri && next[k] === val) delete next[k];
    }
    onChange(next);
  };
  const clear = (ri: number) => {
    const next = { ...ans };
    delete next[ri];
    onChange(next);
  };
  const usedBy = new Map<number, number>();
  if (q.unique) for (const [k, v] of Object.entries(ans)) if (typeof v === 'number') usedBy.set(v, Number(k));
  return (
    <div className={`matrix${q.unique ? ' matrix-unique' : ''}`} role="group" aria-labelledby={labelledBy}>
      {q.unique && (
        <p className={`counter${usedBy.size === q.labels.length ? ' is-done' : ''}`} aria-live="polite">
          {usedBy.size} dari {q.labels.length} nilai terpakai
        </p>
      )}
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
            <div className="matrix-label">
              <span id={id}>{row.label}</span>
              {row.hint && <small>{row.hint}</small>}
              {q.unique && typeof v === 'number' && (
                <button type="button" className="link-btn matrix-clear" onClick={() => clear(ri)}
                  aria-label={`Kosongkan nilai untuk ${row.label}`}>Kosongkan</button>
              )}
            </div>
            <div className="matrix-pills" role="radiogroup" aria-labelledby={id}>
              {q.labels.map((l, i) => (
                <label className={`pill${v === i + 1 ? ' is-on' : ''}${q.unique && v !== i + 1 && usedBy.has(i + 1) ? ' is-taken' : ''}`} key={l}>
                  <input type="radio" name={id} checked={v === i + 1} aria-label={`${i + 1} – ${l}`}
                    onChange={() => pick(ri, i + 1)} />
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
function FieldInput({ f, row, onChange, id, invalid }: {
  f: Field; row: Row; onChange: (patch: Row) => void; id: string; invalid: boolean;
}) {
  const raw = row[f.id];
  const v = typeof raw === 'string' ? raw : '';
  const inv = invalid || undefined;
  const set = (x: string) => onChange({ [f.id]: x });
  switch (f.type) {
    case 'radio':
      return (
        <div className="tiles" role="radiogroup" aria-labelledby={`${id}-l`}>
          {f.choices!.map((c, k) => (
            <label key={c.label} className={`tile${v === c.label ? ' is-on' : ''}`}>
              <input type="radio" name={id} checked={v === c.label} onChange={() => set(c.label)} />
              <span className="tile-art" aria-hidden="true"><EquipmentArt index={k} /></span>
              <span className="tile-text">
                <b>{c.label}</b>
                {c.hint && <small>{c.hint}</small>}
              </span>
              <span className="tile-check" aria-hidden="true" />
            </label>
          ))}
        </div>
      );
    case 'checks': {
      const opts = fieldOptions(f, row);
      const list = Array.isArray(raw) ? raw : [];
      if (!opts.length) {
        return <p className="hint-box" id={id}>Pilih kelompok alat di pertanyaan a terlebih dahulu.</p>;
      }
      const toggle = (o: string) => onChange({ [f.id]: list.includes(o) ? list.filter((x) => x !== o) : [...list, o] });
      return (
        <div className="chips-pick" role="group" aria-labelledby={`${id}-l`} key={String(row[f.dependsOn!])}>
          {opts.map((o, k) => (
            <label key={o} className={`chip${list.includes(o) ? ' is-on' : ''}`} style={{ ['--i' as string]: k }}>
              <input type="checkbox" checked={list.includes(o)} onChange={() => toggle(o)} />
              <span className="chip-mark" aria-hidden="true" />
              {o}
            </label>
          ))}
          {list.includes(LAINNYA) && (
            <input className="input chip-other" type="text" maxLength={200} autoFocus
              placeholder={f.other} aria-label={`Lainnya: ${f.other}`} aria-invalid={inv}
              value={typeof row[otherKey(f)] === 'string' ? (row[otherKey(f)] as string) : ''}
              onChange={(e) => onChange({ [otherKey(f)]: e.target.value })} />
          )}
        </div>
      );
    }
    case 'text':
      return <input id={id} className="input" type="text" maxLength={200} placeholder={f.placeholder} value={v}
        aria-invalid={inv} onChange={(e) => set(e.target.value)} />;
    case 'currency':
      return (
        <div className="affix affix-pre">
          <span className="affix-text">Rp</span>
          <input id={id} className="input input-num" type="text" inputMode="numeric" placeholder={f.placeholder}
            value={formatRupiah(v)} aria-invalid={inv} onChange={(e) => set(digits(e.target.value, 15))} />
        </div>
      );
    case 'int':
      return (
        <div className="affix">
          <input id={id} className="input input-num" type="text" inputMode="numeric" value={v} aria-invalid={inv}
            onChange={(e) => set(digits(e.target.value, 4))} />
          {f.suffix && <span className="affix-text">{f.suffix}</span>}
        </div>
      );
    case 'select':
      return (
        <select id={id} className="input select" value={v} aria-invalid={inv} onChange={(e) => set(e.target.value)}>
          <option value="">Pilih…</option>
          {f.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case 'yesno':
      return (
        <div className="yesno" role="radiogroup" aria-labelledby={`${id}-l`}>
          {['Ya', 'Tidak'].map((o) => (
            <label key={o} className={`pill pill-text${v === o ? ' is-on' : ''}`}>
              <input type="radio" name={id} checked={v === o} onChange={() => set(o)} />
              <span className="pill-num">{o}</span>
            </label>
          ))}
        </div>
      );
    case 'month': {
      const [y = '', m = ''] = v.split('-');
      const setYM = (ny: string, nm: string) => set(ny || nm ? `${ny}-${nm}` : '');
      return (
        <div className="month">
          <select id={id} className="input select" value={m} aria-label={`${f.label}: bulan`} aria-invalid={inv}
            onChange={(e) => setYM(y, e.target.value)}>
            <option value="">Bulan</option>
            {MONTH_NAMES.map((n, i) => <option key={n} value={String(i + 1).padStart(2, '0')}>{n}</option>)}
          </select>
          <select className="input select" value={y} aria-label={`${f.label}: tahun`} aria-invalid={inv}
            onChange={(e) => setYM(e.target.value, m)}>
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
  // Ubah satu kolom; kolom yang bergantung padanya (percabangan) dikosongkan bila induknya berganti.
  const patchRow = (i: number, row: Row, patch: Row) => {
    const next: Row = { ...row, ...patch };
    for (const g of q.fields) {
      if (g.dependsOn && g.dependsOn in patch && patch[g.dependsOn] !== row[g.dependsOn]) {
        next[g.id] = [];
        next[otherKey(g)] = '';
      }
    }
    setRow(i, next);
  };
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
                    const group = f.type === 'radio' || f.type === 'checks';
                    const label = (
                      <>
                        {f.label}
                        {f.optional && <span className="opt"> (opsional)</span>}
                      </>
                    );
                    return (
                      <div className={`rfield rfield-${f.type}${f.wide ? ' is-wide' : ''}${bad.has(f.id) ? ' is-missing' : ''}`} key={f.id}>
                        {group
                          ? <p className="rlabel rlabel-q" id={`${id}-l`}>{label}</p>
                          : <label className="rlabel" htmlFor={id} id={`${id}-l`}>{label}</label>}
                        <FieldInput f={f} id={id} row={row} invalid={bad.has(f.id)}
                          onChange={(patch) => patchRow(i, row, patch)} />
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
