import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QuestionCard, domId } from './components/QuestionCard';
import { Icon } from './components/Icon';
import { CONFIG } from './config';
import { answerText, buildPayload, isVisible, validateStep, type Payload } from './logic';
import { clearDraft, loadDraft, newId, saveDraft } from './storage';
import { SURVEY } from './survey';
import type { Answer, Answers } from './types';

const STEPS = SURVEY.steps;
const INTRO = -1;
const REVIEW = STEPS.length;

type Sending = { state: 'idle' } | { state: 'sending' } | { state: 'error'; message: string };

export default function App() {
  const initial = useMemo(loadDraft, []);
  const [id, setId] = useState(initial?.id ?? newId());
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? {});
  const [startedAt, setStartedAt] = useState<string | null>(initial?.startedAt ?? null);
  const [step, setStep] = useState(INTRO);
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [returnToReview, setReturnToReview] = useState(false);
  const [sending, setSending] = useState<Sending>({ state: 'idle' });
  const [done, setDone] = useState<{ id: string } | null>(null);
  const [focusFirstError, setFocusFirstError] = useState(0);
  const lastPayload = useRef<Payload | null>(null);
  const hasDraft = !!initial && Object.keys(initial.answers).length > 0;

  // Simpan draf otomatis
  useEffect(() => {
    if (!startedAt || done) return;
    const t = setTimeout(() => saveDraft({ id, answers, startedAt, step, savedAt: new Date().toISOString() }), 300);
    return () => clearTimeout(t);
  }, [id, answers, startedAt, step, done]);

  // Pindah halaman → gulir ke atas
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [step, done]);

  const setAnswer = useCallback((num: string, v: Answer) => setAnswers((a) => ({ ...a, [num]: v })), []);

  const issuesFor = useCallback(
    (i: number) => validateStep(STEPS[i].questions, answers),
    [answers],
  );

  // Setelah gagal lanjut: gulir & fokus ke pertanyaan pertama yang bermasalah
  useEffect(() => {
    if (!focusFirstError || step < 0 || step >= REVIEW) return;
    const first = [...issuesFor(step).keys()][0];
    if (!first) return;
    const el = document.getElementById(domId(first));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (el?.querySelector('input:not([disabled]), select, textarea') as HTMLElement | null)?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusFirstError]);

  const start = (fresh: boolean) => {
    if (fresh) {
      clearDraft();
      setId(newId());
      setAnswers({});
      setAttempted(new Set());
      setStartedAt(new Date().toISOString());
      setStep(0);
    } else {
      setStartedAt(initial?.startedAt ?? new Date().toISOString());
      setStep(Math.min(Math.max(initial?.step ?? 0, 0), REVIEW));
    }
  };

  const tryLeave = (target: number) => {
    if (step >= 0 && step < REVIEW && target > step) {
      if (issuesFor(step).size) {
        setAttempted((s) => new Set(s).add(step));
        setFocusFirstError((n) => n + 1);
        return;
      }
    }
    setStep(target);
  };

  const next = () => {
    if (returnToReview) {
      if (issuesFor(step).size) return tryLeave(REVIEW);
      setReturnToReview(false);
      return setStep(REVIEW);
    }
    tryLeave(step + 1);
  };

  const edit = (i: number) => {
    setReturnToReview(true);
    setStep(i);
  };

  const submit = async () => {
    // Pastikan semua bagian valid (mis. draf lama yang belum lengkap)
    const bad = STEPS.findIndex((_, i) => issuesFor(i).size > 0);
    if (bad !== -1) {
      setAttempted((s) => new Set(s).add(bad));
      setReturnToReview(true);
      setStep(bad);
      setFocusFirstError((n) => n + 1);
      return;
    }
    const payload = buildPayload(SURVEY, answers, { id, startedAt });
    lastPayload.current = payload;
    setSending({ state: 'sending' });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
    try {
      const res = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, website: (document.getElementById('hp') as HTMLInputElement | null)?.value ?? '' }),
        signal: ctrl.signal,
      });
      let out: { ok?: boolean; error?: string } = {};
      try { out = await res.json(); } catch { /* bukan JSON */ }
      if (!res.ok || !out.ok) throw new Error(out.error || `Server menjawab ${res.status}.`);
      clearDraft();
      setDone({ id });
      setSending({ state: 'idle' });
    } catch (e) {
      const msg = (e as Error).name === 'AbortError'
        ? 'Koneksi terlalu lama.'
        : (e as Error).message || 'Koneksi gagal.';
      setSending({ state: 'error', message: msg });
    } finally {
      clearTimeout(timer);
    }
  };

  const downloadBackup = () => {
    const p = lastPayload.current ?? buildPayload(SURVEY, answers, { id, startedAt });
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jawaban-kuesioner-${id.slice(0, 8)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const restart = () => {
    clearDraft();
    setDone(null);
    setId(newId());
    setAnswers({});
    setAttempted(new Set());
    setStartedAt(null);
    setStep(INTRO);
  };

  // ── Tampilan ──
  let view: JSX.Element;
  if (done) view = <Done refId={done.id} onRestart={restart} />;
  else if (step === INTRO) view = <Intro hasDraft={hasDraft} onStart={start} />;
  else if (step === REVIEW) {
    view = (
      <Review
        answers={answers} onEdit={edit} onBack={() => setStep(REVIEW - 1)} onSubmit={submit}
        sending={sending} onDownload={downloadBackup}
      />
    );
  } else {
    const s = STEPS[step];
    const issues = attempted.has(step) ? issuesFor(step) : new Map();
    const visible = s.questions.filter((q) => isVisible(q, answers));
    view = (
      <>
        <div className="step-head">
          <p className="kicker">{s.kicker}</p>
          <h2>{s.title}</h2>
          <p className="muted">{s.desc}</p>
        </div>
        {issues.size > 0 && (
          <div className="banner banner-error" role="status">
            <Icon name="alert" />
            <span>{issues.size === 1 ? 'Ada 1 pertanyaan' : `Ada ${issues.size} pertanyaan`} yang perlu dilengkapi sebelum lanjut.</span>
          </div>
        )}
        {visible.map((q) => (
          <QuestionCard key={q.num} q={q} value={answers[q.num]} issue={issues.get(q.num) ?? null}
            onChange={(v) => setAnswer(q.num, v)} />
        ))}
        <nav className="navbar" aria-label="Navigasi kuesioner">
          <div className="navbar-in">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              <Icon name="left" /> Kembali
            </button>
            <span className="saved"><Icon name="check" /> Tersimpan otomatis</span>
            <button type="button" className="btn btn-primary" onClick={next}>
              {returnToReview ? 'Simpan & ke ringkasan' : step === REVIEW - 1 ? 'Periksa jawaban' : 'Lanjut'} <Icon name="right" />
            </button>
          </div>
        </nav>
      </>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><Icon name="crane" /></span>
            <span>
              <b>{SURVEY.org}</b>
              <small>{SURVEY.title}</small>
            </span>
          </div>
          {!done && step >= 0 && <Progress step={step} onJump={(i) => (i < step ? setStep(i) : undefined)} />}
        </div>
      </header>
      <main id="main" tabIndex={-1} className={`main${step === INTRO && !done ? ' main-intro' : ''}`}>
        <div className="wrap">{view}</div>
      </main>
      {/* Umpan untuk bot (honeypot) — tidak terlihat oleh responden */}
      <input id="hp" name="website" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
    </div>
  );
}

function Progress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  const total = STEPS.length + 1;
  const pct = Math.round((Math.min(step, REVIEW) / (total - 1)) * 100);
  const label = step === REVIEW ? 'Ringkasan jawaban' : `${STEPS[step].kicker} · ${STEPS[step].title}`;
  return (
    <div className="progress">
      <div className="progress-text">
        <span>{label}</span>
        <span className="muted">Langkah {Math.min(step + 1, total)} dari {total}</span>
      </div>
      <ol className="progress-steps" aria-label="Kemajuan pengisian">
        {[...STEPS.map((s) => s.kicker), 'Ringkasan'].map((k, i) => (
          <li key={k} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
            <button type="button" disabled={i >= step} onClick={() => onJump(i)}
              aria-current={i === step ? 'step' : undefined} aria-label={`${k}${i < step ? ' (selesai, buka lagi)' : ''}`}>
              <span />
            </button>
          </li>
        ))}
      </ol>
      <span className="sr-only">{pct}% selesai</span>
    </div>
  );
}

function Intro({ hasDraft, onStart }: { hasDraft: boolean; onStart: (fresh: boolean) => void }) {
  const { intro } = SURVEY;
  return (
    <div className="intro">
      <div className="hero">
        <p className="kicker">{SURVEY.subtitle}</p>
        <h1>{SURVEY.title}</h1>
        <p className="lead">{intro.lead}</p>
        <ul className="chips">
          <li><Icon name="clock" /> {SURVEY.duration}</li>
          <li><Icon name="lock" /> Dilaporkan secara agregat</li>
          <li><Icon name="save" /> Tersimpan otomatis</li>
        </ul>
        <div className="cta">
          {hasDraft ? (
            <>
              <button type="button" className="btn btn-primary btn-lg" onClick={() => onStart(false)}>
                Lanjutkan isian sebelumnya <Icon name="right" />
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onStart(true)}>Mulai dari awal</button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-lg" onClick={() => onStart(true)}>
              Mulai mengisi <Icon name="right" />
            </button>
          )}
        </div>
      </div>
      <h2 className="section-title">Survei ini bertujuan memperoleh gambaran mengenai</h2>
      <ol className="goals">
        {intro.goals.map((g) => (
          <li key={g.title}>
            <span className="goal-icon" aria-hidden="true"><Icon name={g.icon} /></span>
            <b>{g.title}</b>
            <p>{g.text}</p>
          </li>
        ))}
      </ol>
      <p className="note"><Icon name="lock" /> {intro.privacy}</p>
      <p className="muted center">{intro.thanks}</p>
    </div>
  );
}

function Review({ answers, onEdit, onBack, onSubmit, sending, onDownload }: {
  answers: Answers; onEdit: (i: number) => void; onBack: () => void; onSubmit: () => void;
  sending: Sending; onDownload: () => void;
}) {
  return (
    <>
      <div className="step-head">
        <p className="kicker">Langkah terakhir</p>
        <h2>Periksa jawaban Anda</h2>
        <p className="muted">Pastikan semuanya sudah benar. Tekan “Ubah” untuk memperbaiki, lalu kirim.</p>
      </div>
      {STEPS.map((s, i) => (
        <section className="rv" key={s.id}>
          <header className="rv-head">
            <div>
              <p className="kicker">{s.kicker}</p>
              <h3>{s.title}</h3>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(i)}>Ubah</button>
          </header>
          <dl>
            {s.questions.filter((q) => isVisible(q, answers)).map((q) => {
              const t = answerText(q, answers);
              return (
                <div className="rv-item" key={q.num}>
                  <dt><span className="qnum qnum-sm">{q.num}</span> {q.short ?? q.title}</dt>
                  <dd>
                    {t === null ? <span className="muted">— tidak diisi</span>
                      : Array.isArray(t) ? <ul>{t.map((x, k) => <li key={k}>{x}</li>)}</ul>
                        : t}
                  </dd>
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
      <nav className="navbar" aria-label="Navigasi kuesioner">
        <div className="navbar-in">
          <button type="button" className="btn btn-ghost" onClick={onBack}><Icon name="left" /> Kembali</button>
          <span className="saved"><Icon name="check" /> Tersimpan otomatis</span>
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={sending.state === 'sending'}>
            {sending.state === 'sending' ? 'Mengirim…' : sending.state === 'error' ? 'Coba kirim lagi' : 'Kirim jawaban'}
            {sending.state !== 'sending' && <Icon name="send" />}
          </button>
        </div>
      </nav>
    </>
  );
}

function Done({ refId, onRestart }: { refId: string; onRestart: () => void }) {
  return (
    <div className="done">
      <span className="done-icon" aria-hidden="true"><Icon name="check" /></span>
      <h1>Terima kasih!</h1>
      <p className="lead">Jawaban Bapak/Ibu sudah kami terima. {SURVEY.intro.thanks}</p>
      <p className="muted small">Kode referensi: <code>{refId.slice(0, 8).toUpperCase()}</code></p>
      <button type="button" className="btn btn-ghost" onClick={onRestart}>Isi untuk proyek lain</button>
    </div>
  );
}
