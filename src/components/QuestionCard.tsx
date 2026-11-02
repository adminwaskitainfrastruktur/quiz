import type { Issue } from '../logic';
import type {
  Answer, ChoiceAnswer, MultiAnswer, Question, RepeaterAnswer,
} from '../types';
import { Allocation, CheckboxGroup, Matrix, RadioGroup, Repeater, Scale, TextInput } from './Inputs';

export const domId = (num: string) => `q-${num.replace(/\./g, '-')}`;

export function QuestionCard({ q, value, onChange, issue, index = 0, done = false }: {
  q: Question; value: Answer | undefined; onChange: (v: Answer) => void; issue: Issue | null;
  index?: number; done?: boolean;
}) {
  const id = domId(q.num);
  const titleId = `${id}-t`;
  const errId = `${id}-e`;

  let body: JSX.Element;
  switch (q.type) {
    case 'text':
    case 'textarea':
      body = <TextInput q={q} value={value as string | undefined} onChange={onChange} labelledBy={titleId} />;
      break;
    case 'radio':
      body = <RadioGroup q={q} value={value as ChoiceAnswer | undefined} onChange={onChange} labelledBy={titleId} />;
      break;
    case 'checkbox':
      body = <CheckboxGroup q={q} value={value as MultiAnswer | undefined} onChange={onChange} labelledBy={titleId} />;
      break;
    case 'scale':
      body = <Scale q={q} value={value as number | undefined} onChange={onChange} labelledBy={titleId} />;
      break;
    case 'matrix':
      body = <Matrix q={q} value={value as Record<string, number> | undefined} onChange={onChange} labelledBy={titleId} issue={issue} />;
      break;
    case 'allocation':
      body = <Allocation q={q} value={value as Record<string, string> | undefined} onChange={onChange} labelledBy={titleId} />;
      break;
    case 'repeater':
      body = <Repeater q={q} value={value as RepeaterAnswer | undefined} onChange={onChange} labelledBy={titleId} issue={issue} />;
      break;
  }

  return (
    <section className={`qcard${issue ? ' has-error' : ''}${done ? ' is-done' : ''}`} id={id}
      aria-describedby={issue ? errId : undefined} style={{ ['--i' as string]: Math.min(index, 8) }}>
      <header className="qhead">
        <span className="qnum">
          <span className="qnum-text">{q.num}</span>
          <svg className="qnum-check" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h3 className="qtitle" id={titleId}>
          {q.title}
          {q.required
            ? <span className="req" aria-label="wajib"> *</span>
            : <span className="opt"> (opsional)</span>}
        </h3>
      </header>
      {q.hint && <p className="qhint">{q.hint}</p>}
      <div className="qbody">{body}</div>
      {issue && <p className="qerror" id={errId} role="alert">{issue.message}</p>}
    </section>
  );
}
