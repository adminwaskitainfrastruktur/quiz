import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Confetti } from './components/Confetti';
import { Icon } from './components/Icon';
import { LogoDanantara, LogoWki } from './components/Logos';
import { Done, QuestionScreen, Review, SectionIntro, Welcome, type Sending } from './components/Screens';
import { CONFIG } from './config';
import { buildPayload, isVisible, optInput, optLabel, validate, type Payload } from './logic';
import { clearDraft, loadDraft, newId, saveDraft } from './storage';
import { SURVEY } from './survey';
import type { Answer, Answers, ChoiceAnswer, Question } from './types';

const STEPS = SURVEY.steps;
/** Warna latar lembut per bagian, berganti halus saat berpindah bagian. */
const TINTS = ['#eef3fb', '#fbf4e6', '#ecf6f0', '#f2eefb', '#eaf5f7', '#fbefec', '#eef3fb'];
const LEAVE_MS = 420;
const AUTO_ADVANCE_MS = 520;

type Screen =
  | { key: 'welcome'; kind: 'welcome' }
  | { key: string; kind: 'section'; step: number }
  | { key: string; kind: 'question'; step: number; q: Question }
  | { key: 'review'; kind: 'review' };

/** Daftar layar sesuai jawaban saat ini (pertanyaan yang dilewati logika lompat tidak ikut). */
function buildScreens(a: Answers): Screen[] {
  const out: Screen[] = [{ key: 'welcome', kind: 'welcome' }];
  STEPS.forEach((s, i) => {
    out.push({ key: `s:${s.id}`, kind: 'section', step: i });
    for (const q of s.questions) if (isVisible(q, a)) out.push({ key: `q:${q.num}`, kind: 'question', step: i, q });
  });
  out.push({ key: 'review', kind: 'review' });
  return out;
}

/** Pilihan tunggal tanpa isian tambahan → langsung lanjut setelah dipilih (seperti Typeform). */
function autoAdvances(q: Question, v: Answer): boolean {
  if (q.type === 'scale') return true;
  if (q.type !== 'radio' || q.dropdown) return false;
  const o = q.options.find((x) => optLabel(x) === (v as ChoiceAnswer).value);
  return !!o && !optInput(o);
}

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function App() {
  const initial = useMemo(loadDraft, []);
  const [id, setId] = useState(initial?.id ?? newId());
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? {});
  const [startedAt, setStartedAt] = useState<string | null>(initial?.startedAt ?? null);
  const [nav, setNav] = useState<{ key: string; from: string | null; dir: 'fwd' | 'back'; n: number }>(
    { key: 'welcome', from: null, dir: 'fwd', n: 0 },
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [sending, setSending] = useState<Sending>({ state: 'idle' });
  const [done, setDone] = useState<{ id: string } | null>(null);
  const lastPayload = useRef<Payload | null>(null);
  const autoTimer = useRef<number | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  const hasDraft = !!initial && Object.keys(initial.answers).length > 0;

  const screens = useMemo(() => buildScreens(answers), [answers]);
  const index = Math.max(0, screens.findIndex((s) => s.key === nav.key));
  const screen = screens[index];
  const stepIndex = screen.kind === 'section' || screen.kind === 'question' ? screen.step : screen.kind === 'review' ? STEPS.length : 0;

  // ── Simpan draf otomatis
  useEffect(() => {
    if (!startedAt || done) return;
    const t = setTimeout(() => saveDraft({ id, answers, startedAt, screen: nav.key, savedAt: new Date().toISOString() }), 300);
    return () => clearTimeout(t);
  }, [id, answers, startedAt, nav.key, done]);

  // ── Perpindahan layar
  const goTo = useCallback((key: string, dir: 'fwd' | 'back') => {
    window.clearTimeout(autoTimer.current);
    setErrorKey(null);
    setNav((p) => (p.key === key ? p : { key, from: p.key, dir, n: p.n + 1 }));
  }, []);

  useEffect(() => {
    if (!nav.from) return;
    const n = nav.n;
    const t = setTimeout(() => setNav((p) => (p.n === n ? { ...p, from: null } : p)), LEAVE_MS);
    return () => clearTimeout(t);
  }, [nav.n, nav.from]);

  // Layar baru: gulir ke atas, fokus ke isian (desktop) atau ke judul (pembaca layar)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    const t = setTimeout(() => {
      const root = stageRef.current?.querySelector('.layer-in');
      if (!root) return;
      const text = root.querySelector<HTMLElement>('.qs-body input[type=text]:not([inputmode]), .qs-body input[type=email], .qs-body textarea');
      const single = root.querySelector('.qs-body .rcard, .qs-body .alloc, .qs-body .matrix') === null;
      if (text && single && canHover()) text.focus({ preventScroll: true });
      else (root.querySelector<HTMLElement>('h1, h2') ?? null)?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [nav.n, done]);

  const firstInvalid = (a: Answers) => {
    for (const s of buildScreens(a)) if (s.kind === 'question' && validate(s.q, a)) return s;
    return null;
  };

  const goReview = () => {
    const bad = firstInvalid(answers);
    if (bad) {
      goTo(bad.key, 'back');
      setTimeout(() => setErrorKey(bad.key), 0);
      return;
    }
    setReturnToReview(false);
    goTo('review', 'fwd');
  };

  const next = () => {
    if (screen.kind === 'welcome') return start(!hasDraft);
    if (screen.kind === 'review') return;
    if (screen.kind === 'question' && validate(screen.q, answers)) {
      setErrorKey(screen.key);
      setShake((n) => n + 1);
      return;
    }
    if (returnToReview && screen.kind === 'question') return goReview();
    const target = screens[index + 1];
    if (target.kind === 'review') return goReview();
    goTo(target.key, 'fwd');
  };
  const prev = () => {
    if (index > 1) goTo(screens[index - 1].key, 'back');
  };
  // Selalu memakai versi terbaru untuk pindah otomatis & pintasan keyboard
  const nextRef = useRef(next);
  nextRef.current = next;

  const setAnswer = (q: Question, v: Answer) => {
    setAnswers((a) => ({ ...a, [q.num]: v }));
    if (errorKey === `q:${q.num}`) setErrorKey(null);
    window.clearTimeout(autoTimer.current);
    if (autoAdvances(q, v)) autoTimer.current = window.setTimeout(() => nextRef.current(), AUTO_ADVANCE_MS);
  };

  const start = (fresh: boolean) => {
    if (fresh) {
      clearDraft();
      setId(newId());
      setAnswers({});
      setStartedAt(new Date().toISOString());
      goTo(`s:${STEPS[0].id}`, 'fwd');
    } else {
      setStartedAt(initial?.startedAt ?? new Date().toISOString());
      const saved = initial?.screen;
      const known = saved && buildScreens(initial!.answers).some((s) => s.key === saved) && saved !== 'welcome';
      goTo(known ? saved! : `s:${STEPS[0].id}`, 'fwd');
    }
  };

  // ── Pintasan keyboard: Enter = lanjut, huruf = pilih opsi, angka = skala
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      const tag = t.tagName;
      const typing = tag === 'INPUT' && !['radio', 'checkbox'].includes((t as HTMLInputElement).type);
      if (e.key === 'Enter') {
        if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'A') return;
        if (tag === 'TEXTAREA' && (e.shiftKey || !canHover())) return;
        e.preventDefault();
        nextRef.current();
        return;
      }
      if (typing || tag === 'TEXTAREA' || tag === 'SELECT' || e.shiftKey) return;
      const root = stageRef.current?.querySelector('.layer-in');
      if (!root) return;
      if (/^[a-z]$/i.test(e.key)) {
        const opts = root.querySelectorAll<HTMLInputElement>('.qs-body .choices > .choice > .choice-row > input');
        const el = opts[e.key.toUpperCase().charCodeAt(0) - 65];
        if (el && !el.disabled) { e.preventDefault(); el.click(); }
      } else if (/^[0-9]$/.test(e.key)) {
        const pill = [...root.querySelectorAll<HTMLInputElement>('.qs-body .scale input')]
          .find((x) => x.closest('.pill')?.querySelector('.pill-num')?.textContent === e.key);
        if (pill) { e.preventDefault(); pill.click(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done]);

  // ── Kirim
  const submit = async () => {
    const bad = firstInvalid(answers);
    if (bad) {
      setReturnToReview(true);
      goTo(bad.key, 'back');
      setTimeout(() => setErrorKey(bad.key), 0);
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
      const msg = (e as Error).name === 'AbortError' ? 'Koneksi terlalu lama.' : (e as Error).message || 'Koneksi gagal.';
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
    setStartedAt(null);
    setNav({ key: 'welcome', from: null, dir: 'back', n: nav.n + 1 });
  };

  // ── Menggambar satu layar (dipakai untuk layar masuk & layar yang sedang keluar)
  const render = (key: string, ghost: boolean): ReactNode => {
    const s = screens.find((x) => x.key === key) ?? buildScreens(answers).find((x) => x.key === key);
    if (!s) return null;
    switch (s.kind) {
      case 'welcome':
        return <Welcome hasDraft={hasDraft} onStart={start} />;
      case 'section':
        return <SectionIntro step={STEPS[s.step]} index={s.step} answers={answers} onNext={next} />;
      case 'question': {
        const issue = errorKey === key ? validate(s.q, answers) : null;
        const pos = screens.findIndex((x) => x.key === key);
        const last = screens[pos + 1]?.kind === 'review';
        return (
          <QuestionScreen q={s.q} step={STEPS[s.step]} value={answers[s.q.num]} onChange={(v) => setAnswer(s.q, v)}
            issue={issue} shake={shake} onNext={next} ghost={ghost}
            nextLabel={returnToReview ? 'Simpan & ke ringkasan' : last ? 'Selesai' : 'OK'} />
        );
      }
      case 'review':
        return (
          <Review answers={answers} sending={sending} onSubmit={submit} onDownload={downloadBackup}
            onEdit={(num) => { setReturnToReview(true); goTo(`q:${num}`, 'back'); }} />
        );
    }
  };

  const inForm = !done && screen.kind !== 'welcome';
  const progress = Math.round((index / (screens.length - 1)) * 100);
  const tint = done ? TINTS[0] : TINTS[Math.min(stepIndex, TINTS.length - 1)];

  return (
    <div className={`app${inForm ? ' in-form' : ''}`} style={{ '--tint': tint } as CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <LogoWki />
          <span className="brand-text"><b>{SURVEY.org}</b><small>{SURVEY.title}</small></span>
        </div>
        <LogoDanantara className="topbar-partner" />
        {inForm && (
          <div className="topbar-meta" aria-live="polite">
            <span className="topbar-step" key={stepIndex}>
              {screen.kind === 'review' ? 'Ringkasan' : STEPS[stepIndex].kicker}
            </span>
            <span className="topbar-pct">{progress}%</span>
          </div>
        )}
        <div className="progress" role="progressbar" aria-label="Kemajuan pengisian"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={done ? 100 : progress} hidden={!inForm && !done}>
          <span style={{ width: `${done ? 100 : progress}%` }} />
        </div>
      </header>

      <main id="main" className="stage" ref={stageRef}>
        {done ? (
          <div className="layer layer-in dir-fwd" key="done"><Done refId={done.id} onRestart={restart} /></div>
        ) : (
          <>
            {nav.from && (
              <div className={`layer layer-out dir-${nav.dir}`} key={`out-${nav.n}`} aria-hidden="true"
                ref={(el) => el?.setAttribute('inert', '')}>
                {render(nav.from, true)}
              </div>
            )}
            <div className={`layer layer-in dir-${nav.dir}`} key={`in-${nav.key}`}>{render(nav.key, false)}</div>
          </>
        )}
      </main>

      {inForm && (
        <Dock>
          <nav className="dock" aria-label="Navigasi pertanyaan">
            <span className="saved"><Icon name="check" /> Tersimpan otomatis</span>
            <span className="dock-btns">
              <button type="button" className="dock-btn" onClick={prev} disabled={index <= 1} aria-label="Sebelumnya">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" className="dock-btn" onClick={next} disabled={screen.kind === 'review'} aria-label="Berikutnya">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </span>
          </nav>
        </Dock>
      )}
      {done && <Confetti />}
      {/* Umpan untuk bot (honeypot) — tidak terlihat oleh responden */}
      <input id="hp" name="website" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
    </div>
  );
}

/** Dirender langsung di <body> agar `position: fixed` tidak terpengaruh animasi layar. */
function Dock({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

