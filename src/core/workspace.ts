import type { Application, Answers, Answer, Field } from './types';

export function fieldError(field: Field, value: string): string | null {
  if (!value.trim()) return field.required ? 'This question still needs your answer.' : null;
  if (field.maxLength && value.length > field.maxLength) return `Use ${field.maxLength} characters or fewer.`;
  if (value.length > 6000) return 'Use 6,000 characters or fewer.';
  if (field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a complete email address.';
  if (field.kind === 'number' && (!/^\d+(?:\.\d{1,2})?$/.test(value.trim()) || !Number.isFinite(Number(value)) || Number(value) < 0)) return 'Enter a nonnegative amount, with up to two decimal places.';
  return null;
}

export function canExport(application: Application, answers: Answers): boolean {
  return application.fields.length > 0 && application.fields.every(field => {
    const value = answers[field.id]?.value ?? '';
    return !fieldError(field, value) && (!value.trim() || answers[field.id]?.reviewed === true);
  });
}

export function exportPacket(application: Application, answers: Answers): string {
  if (!canExport(application, answers)) throw new Error('Answer the required questions and review every completed answer before exporting.');
  return [
    application.title,
    'Prepared with Clearpath · Not submitted',
    'Review this draft against the original application before you use it. Source excerpts show where wording came from; they do not verify truth or eligibility.',
    ...application.fields.map(field => {
      const answer = answers[field.id];
      if (!answer?.value.trim()) return `${field.label}\nNot provided (optional)`;
      const provenance = answer.evidence.map(e => `Source ${e.sourceId}: “${e.quote}”`).join('\n');
      return `${field.label}\n${answer.value}\n${provenance || 'Entered by applicant.'}`;
    }),
  ].join('\n\n');
}

export function editAnswer(previous: Answer, value: string): Answer {
  return { fieldId: previous.fieldId, value, evidence: [], origin: 'person', reviewed: false };
}
