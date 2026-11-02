// Pertanyaan peringkat "ketuk sesuai urutan" (dipakai matriks dengan unique: true, mis. 3.2 dan 3.6).
// Data yang disimpan sama dengan matriks: { indeksBaris: nilai }, dengan nilai n = peringkat #1.
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { rowOf, type Issue } from '../logic';
import type { MatrixQ } from '../types';

export function Ranking({ q, value, onChange, labelledBy, issue }: {
  q: MatrixQ; value: Record<string, number> | undefined; onChange: (v: Record<string, number>) => void;
  labelledBy: string; issue: Issue | null;
}) {
  const n = q.labels.length;
  const ans = value ?? {};
  const rows = q.rows.map(rowOf);
  const all = rows.map((_, i) => i);
  const ranked = all.filter((i) => typeof ans[i] === 'number').sort((a, b) => ans[b] - ans[a]);
  const unranked = all.filter((i) => typeof ans[i] !== 'number');
  const full = ranked.length >= n;
  /** Label untuk peringkat ke-k (1-based): #1 = label nilai tertinggi. */
  const rankLabel = (k: number) => q.labels[n - k];

  const write = (order: number[]) => {
    const next: Record<string, number> = {};
    order.slice(0, n).forEach((ri, k) => { next[ri] = n - k; });
    onChange(next);
  };
  const add = (ri: number) => { if (!full) write([...ranked, ri]); };
  const remove = (ri: number) => write(ranked.filter((x) => x !== ri));
  const move = (ri: number, d: number) => {
    const o = [...ranked];
    const k = o.indexOf(ri);
    const j = k + d;
    if (j < 0 || j >= o.length) return;
    [o[k], o[j]] = [o[j], o[k]];
    write(o);
  };

  // Animasi FLIP: kartu meluncur halus ke posisi barunya saat urutan berubah
  const refs = useRef(new Map<number, HTMLElement>());
  const last = useRef(new Map<number, DOMRect>());
  const orderKey = [...ranked, -1, ...unranked].join(',');
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    refs.current.forEach((el, ri) => {
      const now = el.getBoundingClientRect();
      const before = last.current.get(ri);
      if (before && !reduce) {
        const dy = before.top - now.top;
        if (Math.abs(dy) > 1 && typeof el.animate === 'function') {
          el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
            { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
      }
      last.current.set(ri, now);
    });
  }, [orderKey]);

  const missing = new Set(issue?.rows ?? []);
  const item = (ri: number) => {
    const k = ranked.indexOf(ri) + 1; // 0 bila belum diurutkan
    const on = k > 0;
    const off = !on && full;
    return (
      <li key={ri} ref={(el) => { if (el) refs.current.set(ri, el); else refs.current.delete(ri); }}
        className={`rank-item${on ? ' is-ranked' : ''}${k === 1 ? ' is-first' : ''}${off ? ' is-off' : ''}${missing.has(ri) ? ' is-missing' : ''}`}
        style={{ '--i': ri } as CSSProperties}>
        <button type="button" className="rank-main" disabled={off} aria-pressed={on}
          onClick={() => (on ? remove(ri) : add(ri))}
          aria-label={on ? `${rows[ri].label}, peringkat ${k}. Ketuk untuk melepas.` : `Pilih ${rows[ri].label} sebagai peringkat ${ranked.length + 1}`}>
          <span className="rank-badge" key={on ? `r${k}` : 'plus'} aria-hidden="true">{on ? k : '+'}</span>
          <span className="rank-text">
            <b>{rows[ri].label}</b>
            {rows[ri].hint && <small>{rows[ri].hint}</small>}
            {on && <em>{rankLabel(k)}</em>}
          </span>
        </button>
        {on && (
          <span className="rank-tools">
            <button type="button" className="rank-move" disabled={k === 1} onClick={() => move(ri, -1)} aria-label={`Naikkan ${rows[ri].label}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="rank-move" disabled={k === ranked.length} onClick={() => move(ri, 1)} aria-label={`Turunkan ${rows[ri].label}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="ranking" role="group" aria-labelledby={labelledBy}>
      <div className="rank-head">
        <span className="rank-slots" aria-hidden="true">
          {Array.from({ length: n }, (_, k) => <span key={k} className={k < ranked.length ? 'is-on' : ''} />)}
        </span>
        <span className={`counter${full ? ' is-done' : ''}`} aria-live="polite">
          {full ? `${n} dari ${n} terurut` : `${ranked.length} dari ${n} terurut — ketuk ${ranked.length === 0 ? 'yang paling atas dulu' : `untuk peringkat #${ranked.length + 1}`}`}
        </span>
        {ranked.length > 0 && (
          <button type="button" className="link-btn rank-reset" onClick={() => write([])}>Ulangi</button>
        )}
      </div>
      <ol className="rank-list">
        {ranked.map(item)}
        {unranked.length > 0 && ranked.length > 0 && (
          <li className="rank-divider" aria-hidden="true">{full ? 'Tidak masuk peringkat' : 'Belum diurutkan'}</li>
        )}
        {unranked.map(item)}
      </ol>
    </div>
  );
}
