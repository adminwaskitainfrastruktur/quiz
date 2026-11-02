// Draf jawaban disimpan di browser responden agar isian tidak hilang
// bila halaman tertutup atau koneksi putus.
import { CONFIG } from './config';
import type { Answers } from './types';

export interface Draft {
  id: string;
  answers: Answers;
  startedAt: string | null;
  /** -1 = halaman pembuka, 0..n-1 = langkah, n = ringkasan */
  step: number;
  savedAt: string;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && typeof d.id === 'string' && d.answers ? d : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(d));
  } catch {
    /* penyimpanan tidak tersedia (mode privat) — kuesioner tetap jalan */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(CONFIG.storageKey);
  } catch {
    /* abaikan */
  }
}
