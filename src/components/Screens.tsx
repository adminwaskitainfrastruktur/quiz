// Layar-layar kuesioner bergaya "satu pertanyaan per layar".
import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { answerText, isVisible, type Issue } from '../logic';
import { SURVEY } from '../survey';
import type { Answer, Answers, Question, Step } from '../types';
import { HeroScene, StepArt } from './Art';
import { Icon } from './Icon';
import { LogoDanantara, LogoWki } from './Logos';
import { QuestionInput, domId } from './QuestionInput';

export type Sending = { state: 'idle' } | { state: 'sending' } | { state: 'error'; message: string };

/** Petunjuk keyboard; disembunyikan di perangkat sentuh lewat CSS. */
export const EnterHint = ({ text = 'tekan' }: { text?: string }) => (
  <span className="kbd-hint" aria-hidden="true">{text} <b>Enter ↵</b></span>
);

/** Panel ilustrasi yang sedikit bergerak mengikuti kursor (desktop). */
function ArtPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
    el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
  };
  return (
    <div ref={ref} className={`art-panel ${className}`} onMouseMove={move} aria-hidden="true">
      <div className="art-panel-in">{children}</div>
    </div>
  );
}

// ── Halaman pembuka ──────────────────────────────────────────────
export function Welcome({ hasDraft, onStart }: { hasDraft: boolean; onStart: (fresh: boolean) => void }) {
  const { intro } = SURVEY;
  return (
    <div className="split">
      <ArtPanel className="art-hero"><HeroScene /></ArtPanel>
      <div className="split-text">
        <div className="logo-row reveal" style={{ '--d': 0 } as CSSProperties}>
          <LogoWki className="logo-lg" bare />
          <span className="logo-sep" aria-hidden="true" />
          <LogoDanantara className="logo-lg" />
        </div>
        <p className="eyebrow reveal" style={{ '--d': 0 } as CSSProperties}>{SURVEY.org}</p>
        <h1 tabIndex={-1} className="display reveal" style={{ '--d': 1 } as CSSProperties}>{SURVEY.title}</h1>
        <p className="lead reveal" style={{ '--d': 2 } as CSSProperties}>{intro.lead}</p>
        <ul className="goal-list reveal" style={{ '--d': 3 } as CSSProperties}>
          {intro.goals.map((g) => (
            <li key={g.title}><span className="goal-ic"><Icon name={g.icon} /></span><span><b>{g.title}</b><span className="goal-desc"> — {g.text}</span></span></li>
          ))}
        </ul>
        <div className="cta reveal" style={{ '--d': 4 } as CSSProperties}>
          {hasDraft ? (
            <>
              <button type="button" className="btn btn-primary btn-lg" onClick={() => onStart(false)}>
                Lanjutkan isian <Icon name="right" />
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onStart(true)}>Mulai dari awal</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-lg" onClick={() => onStart(true)}>
                Mulai <Icon name="right" />
              </button>
              <EnterHint />
            </>
          )}
        </div>
        <p className="meta reveal" style={{ '--d': 5 } as CSSProperties}>
          <span><Icon name="clock" /> {SURVEY.duration}</span>
          <span><Icon name="save" /> Tersimpan otomatis</span>
        </p>
        <p className="fine reveal" style={{ '--d': 6 } as CSSProperties}><Icon name="lock" /> {intro.privacy}</p>
      </div>
    </div>
  );
}

// ── Pembuka tiap bagian ──────────────────────────────────────────
export function SectionIntro({ step, index, answers, onNext }: {
  step: Step; index: number; answers: Answers; onNext: () => void;
}) {
  const steps = SURVEY.steps;
  const count = step.questions.filter((q) => isVisible(q, answers)).length;
  const minutes = Math.max(1, Math.round((count * 25) / 60));
  return (
    <div className="split split-section">
      <ArtPanel className="art-step"><StepArt id={step.id} /></ArtPanel>
      <div className="split-text">
        <p className="eyebrow reveal" style={{ '--d': 0 } as CSSProperties}>
          {step.kicker} · {index + 1} dari {steps.length}
        </p>
        <h2 tabIndex={-1} className="display reveal" style={{ '--d': 1 } as CSSProperties}>{step.title}</h2>
        {step.bridge && <p className="bridge reveal" style={{ '--d': 2 } as CSSProperties}>{step.bridge}</p>}
        <p className="lead reveal" style={{ '--d': 3 } as CSSProperties}>{step.desc}</p>
        <ol className="roadmap reveal" style={{ '--d': 4 } as CSSProperties} aria-label="Bagian kuesioner">
          {steps.map((s, i) => (
            <li key={s.id} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} style={{ '--i': i } as CSSProperties}>
              <span className="rm-dot">{i < index ? <Icon name="check" /> : i + 1}</span>
              <span className="rm-text">{s.title}</span>
            </li>
          ))}
        </ol>
        <div className="cta reveal" style={{ '--d': 5 } as CSSProperties}>
          <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
            {index === 0 ? 'Mulai bagian ini' : 'Lanjut'} <Icon name="right" />
          </button>
          <EnterHint />
        </div>
        <p className="meta reveal" style={{ '--d': 6 } as CSSProperties}>
          <span><Icon name="gauge" /> {count} pertanyaan</span>
          <span><Icon name="clock" /> ± {minutes} menit</span>
        </p>
      </div>
    </div>
  );
}

// ── Layar pertanyaan ─────────────────────────────────────────────
export function QuestionScreen({ q, step, value, onChange, issue, shake, onNext, nextLabel, ghost }: {
  q: Question; step: Step; value: Answer | undefined; onChange: (v: Answer) => void;
  issue: Issue | null; shake: number; onNext: () => void; nextLabel: string; ghost?: boolean;
}) {
  const id = ghost ? undefined : domId(q.num);
  const titleId = `${domId(q.num)}-t${ghost ? '-g' : ''}`;
  const wide = q.type === 'matrix' || q.type === 'repeater' || q.type === 'allocation';
  const keyed = (q.type === 'radio' && !q.dropdown) || q.type === 'checkbox';
  return (
    <section className={`qs${wide ? ' qs-wide' : ''}${issue ? ' has-error' : ''}`} id={id} aria-labelledby={titleId}>
      <p className="qs-crumb reveal" style={{ '--d': 0 } as CSSProperties}>{step.kicker} · {step.title}</p>
      <h2 tabIndex={-1} className="qs-title reveal" id={titleId} style={{ '--d': 1 } as CSSProperties}>
        <span className="qs-num">{q.num}<Icon name="right" /></span>
        <span>
          {q.title}
          {q.required ? <span className="req" aria-label="wajib"> *</span> : <span className="opt"> (opsional)</span>}
        </span>
      </h2>
      {q.hint && <p className="qs-hint reveal" style={{ '--d': 2 } as CSSProperties}>{q.hint}</p>}
      {keyed && <p className="qs-keys reveal" style={{ '--d': 2 } as CSSProperties} aria-hidden="true">Klik pilihan atau tekan hurufnya di keyboard.</p>}
      <div className="qs-body reveal" style={{ '--d': 3 } as CSSProperties}>
        <QuestionInput q={q} value={value} onChange={onChange} issue={issue} labelledBy={titleId} />
      </div>
      {issue && (
        <p className="qs-error" role="alert" key={shake}>
          <Icon name="alert" /> {issue.message}
        </p>
      )}
      <div className="qs-actions reveal" style={{ '--d': 4 } as CSSProperties}>
        <button type="button" className="btn btn-primary btn-ok" onClick={onNext}>
          {nextLabel} <Icon name="check" />
        </button>
        <EnterHint text={q.type === 'textarea' ? 'Shift + Enter = baris baru ·' : 'tekan'} />
      </div>
    </section>
  );
}

// ── Ringkasan ────────────────────────────────────────────────────
export function Review({ answers, onEdit, onSubmit, sending, onDownload }: {
  answers: Answers; onEdit: (num: string) => void; onSubmit: () => void;
  sending: Sending; onDownload: () => void;
}) {
  return (
    <div className="review">
      <p className="eyebrow reveal" style={{ '--d': 0 } as CSSProperties}>Langkah terakhir</p>
      <h2 tabIndex={-1} className="display reveal" style={{ '--d': 1 } as CSSProperties}>Periksa jawaban Anda</h2>
      <p className="lead reveal" style={{ '--d': 2 } as CSSProperties}>
        Tekan <b>Ubah</b> pada jawaban yang ingin diperbaiki. Bila sudah sesuai, kirim jawaban di bagian bawah.
      </p>
      {SURVEY.steps.map((s, i) => (
        <section className="rv reveal" key={s.id} style={{ '--d': 3 + Math.min(i, 4) } as CSSProperties}>
          <header className="rv-head">
            <p className="eyebrow">{s.kicker}</p>
            <h3>{s.title}</h3>
          </header>
          <dl>
            {s.questions.filter((q) => isVisible(q, answers)).map((q) => {
              const t = answerText(q, answers);
              return (
                <div className="rv-item" key={q.num}>
                  <dt><span className="rv-num">{q.num}</span> {q.short ?? q.title}</dt>
                  <dd>
                    {t === null ? <span className="muted">— tidak diisi</span>
                      : Array.isArray(t) ? <ul>{t.map((x, k) => <li key={k}>{x}</li>)}</ul>
                        : t}
                  </dd>
                  <button type="button" className="link-btn rv-edit" onClick={() => onEdit(q.num)}
                    aria-label={`Ubah jawaban ${q.num}`}>Ubah</button>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
      {sending.state === 'error' && (
        <div className="banner banner-error" role="alert">
          <Icon name="alert" />
          <div>
            <b>Jawaban belum terkirim.</b> {sending.message} Jawaban Anda tetap tersimpan di perangkat ini —
            silakan coba kirim lagi. Bila masih gagal,{' '}
            <button type="button" className="link-btn" onClick={onDownload}>unduh salinan jawaban</button>{' '}
            dan kirimkan ke panitia survei.
          </div>
        </div>
      )}
      <div className="submit-bar">
        <button type="button" className="btn btn-primary btn-lg" onClick={onSubmit} disabled={sending.state === 'sending'}>
          {sending.state === 'sending' ? <><span className="spinner" aria-hidden="true" /> Mengirim…</>
            : sending.state === 'error' ? <>Coba kirim lagi <Icon name="send" /></>
              : <>Kirim jawaban <Icon name="send" /></>}
        </button>
      </div>
    </div>
  );
}

// ── Selesai ──────────────────────────────────────────────────────
export function Done({ refId, onRestart }: { refId: string; onRestart: () => void }) {
  return (
    <div className="done">
      <div className="logo-row logo-row-center reveal" style={{ '--d': 0 } as CSSProperties}>
        <LogoWki className="logo-lg" bare />
        <span className="logo-sep" aria-hidden="true" />
        <LogoDanantara className="logo-lg" />
      </div>
      <svg className="done-check" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="44" />
        <path d="M28 50 l13 13 l27 -29" />
      </svg>
      <h1 tabIndex={-1} className="display reveal" style={{ '--d': 2 } as CSSProperties}>Terima kasih!</h1>
      <p className="lead reveal" style={{ '--d': 3 } as CSSProperties}>Jawaban Bapak/Ibu sudah kami terima. {SURVEY.intro.thanks}</p>
      <p className="fine reveal" style={{ '--d': 4 } as CSSProperties}>Kode referensi: <code>{refId.slice(0, 8).toUpperCase()}</code></p>
      <button type="button" className="btn btn-ghost reveal" style={{ '--d': 5 } as CSSProperties} onClick={onRestart}>
        Isi untuk proyek lain
      </button>
    </div>
  );
}
