// Isian jawaban untuk satu pertanyaan (tanpa bingkai); tata letaknya diatur oleh layar pertanyaan.
import type { Issue } from '../logic';
import type { Answer, ChoiceAnswer, MultiAnswer, Question, RepeaterAnswer } from '../types';
import { Allocation, CheckboxGroup, Matrix, RadioGroup, Repeater, Scale, TextInput } from './Inputs';

export const domId = (num: string) => `q-${num.replace(/\./g, '-')}`;

export function QuestionInput({ q, value, onChange, issue, labelledBy }: {
  q: Question; value: Answer | undefined; onChange: (v: Answer) => void; issue: Issue | null; labelledBy: string;
}) {
  switch (q.type) {
    case 'text':
    case 'textarea':
      return <TextInput q={q} value={value as string | undefined} onChange={onChange} labelledBy={labelledBy} />;
    case 'radio':
      return <RadioGroup q={q} value={value as ChoiceAnswer | undefined} onChange={onChange} labelledBy={labelledBy} />;
    case 'checkbox':
      return <CheckboxGroup q={q} value={value as MultiAnswer | undefined} onChange={onChange} labelledBy={labelledBy} />;
    case 'scale':
      return <Scale q={q} value={value as number | undefined} onChange={onChange} labelledBy={labelledBy} />;
    case 'matrix':
      return <Matrix q={q} value={value as Record<string, number> | undefined} onChange={onChange} labelledBy={labelledBy} issue={issue} />;
    case 'allocation':
      return <Allocation q={q} value={value as Record<string, string> | undefined} onChange={onChange} labelledBy={labelledBy} />;
    case 'repeater':
      return <Repeater q={q} value={value as RepeaterAnswer | undefined} onChange={onChange} labelledBy={labelledBy} issue={issue} />;
  }
}
